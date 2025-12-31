/**
 * ShopSite API Client
 * 
 * Handles communication with the ShopSite db_xml.cgi endpoint
 * and Order Download API for data migration.
 */

import {
    ShopSiteProduct,
    ShopSiteOrder,
    ShopSiteOrderItem,
    ShopSiteCustomer,
    ShopSiteConfigSchema,
    ConnectionTestResult,
    ShopSiteConfig,
} from './types';

export { ShopSiteConfigSchema };
export type { ShopSiteConfig } from './types';


/**
 * Client for interacting with ShopSite APIs.
 * Handles product, order, and customer data retrieval.
 */
export class ShopSiteClient {
    private readonly config: ShopSiteConfig;
    private readonly authHeader: string;

    constructor(config: ShopSiteConfig) {
        // Validate config
        const result = ShopSiteConfigSchema.safeParse(config);
        if (!result.success || !config.storeUrl || !config.merchantId) {
            throw new Error('Invalid ShopSite configuration');
        }

        this.config = config;
        this.authHeader = `Basic ${Buffer.from(`${config.merchantId}:${config.password}`).toString('base64')}`;
    }

    /**
     * Build the full URL for the API request.
     * Handles various storeUrl formats and different CGI scripts.
     */
    private buildUrl(queryParams: string, scriptName: string = 'db_xml.cgi'): string {
        let baseUrl = this.config.storeUrl.replace(/\/$/, '');

        // If the URL ends in .cgi, strip the filename to get the directory
        if (baseUrl.endsWith('.cgi')) {
            const lastSlash = baseUrl.lastIndexOf('/');
            if (lastSlash !== -1) {
                baseUrl = baseUrl.substring(0, lastSlash);
            }
        }

        return `${baseUrl}/${scriptName}?${queryParams}`;
    }

    /**
     * Test the connection to ShopSite.
     * Makes a lightweight request to verify credentials.
     */
    async testConnection(): Promise<ConnectionTestResult> {
        try {
            const response = await fetch(
                this.buildUrl('action=list', 'db_xml.cgi'),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': this.authHeader,
                    },
                }
            );

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Fetch all products from ShopSite db_xml.cgi endpoint.
     */
    async fetchProducts(): Promise<ShopSiteProduct[]> {
        try {
            const response = await fetch(
                this.buildUrl('action=download&type=products', 'db_xml.cgi'),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': this.authHeader,
                    },
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch products: ${response.status}`);
                return [];
            }

            const xmlText = await response.text();
            return this.parseProductsXml(xmlText);
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    /**
     * Fetch all orders from ShopSite Order Download API.
     */
    async fetchOrders(): Promise<ShopSiteOrder[]> {
        try {
            // Revert to using db_xml.cgi for orders as well
            // Based on docs, db_xml.cgi handles order downloads too
            const response = await fetch(
                this.buildUrl('action=download&type=orders', 'db_xml.cgi'),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': this.authHeader,
                    },
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch orders: ${response.status}`);
                return [];
            }

            // Handle encoding (ShopSite is strict ISO-8859-1)
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder('iso-8859-1');
            const xmlText = decoder.decode(buffer);

            console.log(`[ShopSite] Downloaded orders XML: ${xmlText.length} chars`);
            return this.parseOrdersXml(xmlText);
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    }

    /**
     * Fetch all registered customers from ShopSite.
     */
    async fetchCustomers(): Promise<ShopSiteCustomer[]> {
        try {
            const response = await fetch(
                this.buildUrl('action=download&type=customers', 'db_xml.cgi'),
                {
                    method: 'GET',
                    headers: {
                        'Authorization': this.authHeader,
                    },
                }
            );

            if (!response.ok) {
                console.error(`Failed to fetch customers: ${response.status}`);
                return [];
            }

            const xmlText = await response.text();
            return this.parseCustomersXml(xmlText);
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [];
        }
    }

    // ============================================================================
    // XML Parsing Methods
    // ============================================================================

    private parseProductsXml(xmlText: string): ShopSiteProduct[] {
        const products: ShopSiteProduct[] = [];

        // Use regex for server-side XML parsing (DOMParser not available in Node)
        const productMatches = xmlText.match(/<product>([\s\S]*?)<\/product>/gi);
        if (!productMatches) return products;

        for (const productXml of productMatches) {
            const sku = this.extractXmlValue(productXml, 'sku');
            const name = this.extractXmlValue(productXml, 'name');
            const price = parseFloat(this.extractXmlValue(productXml, 'price') || '0');
            const description = this.extractXmlValue(productXml, 'description');
            const quantityOnHand = parseInt(this.extractXmlValue(productXml, 'quantity_on_hand') || '0', 10);
            const imageUrl = this.extractXmlValue(productXml, 'graphic');

            if (sku && name) {
                products.push({
                    sku,
                    name,
                    price,
                    description,
                    quantityOnHand,
                    imageUrl,
                });
            }
        }

        return products;
    }

    private parseOrdersXml(xmlText: string): ShopSiteOrder[] {
        const orders: ShopSiteOrder[] = [];
        const startTag = '<Order>';
        const endTag = '</Order>';
        let searchPos = 0;

        // Iterate through the XML using indexOf (much faster than global regex on large files)
        while (true) {
            const startIdx = xmlText.indexOf(startTag, searchPos);
            if (startIdx === -1) break;

            const endIdx = xmlText.indexOf(endTag, startIdx);
            if (endIdx === -1) break;

            const orderXml = xmlText.substring(startIdx, endIdx + endTag.length);
            searchPos = endIdx + endTag.length;

            // Extract order-level fields (PascalCase per DTD)
            const orderNumber = this.extractXmlValue(orderXml, 'OrderNumber');
            const orderDate = this.extractXmlValue(orderXml, 'OrderDate');

            // Extract customer email from Billing section
            const billingMatch = orderXml.match(/<Billing>([\s\S]*?)<\/Billing>/i);
            const customerEmail = billingMatch
                ? this.extractXmlValue(billingMatch[1], 'Email') || ''
                : '';

            // Extract totals from Totals section
            const totalsMatch = orderXml.match(/<Totals>([\s\S]*?)<\/Totals>/i);
            let grandTotal = 0;
            let tax = 0;
            let shippingTotal = 0;
            if (totalsMatch) {
                grandTotal = parseFloat(this.extractXmlValue(totalsMatch[1], 'GrandTotal') || '0');
                const taxMatch = totalsMatch[1].match(/<Tax>([\s\S]*?)<\/Tax>/i);
                if (taxMatch) {
                    tax = parseFloat(this.extractXmlValue(taxMatch[1], 'TaxAmount') || '0');
                }
                const shippingMatch = totalsMatch[1].match(/<ShippingTotal>([\s\S]*?)<\/ShippingTotal>/i);
                if (shippingMatch) {
                    shippingTotal = parseFloat(this.extractXmlValue(shippingMatch[1], 'Total') || '0');
                }
            }

            // Parse order items from Shipping/Products/Product
            const items: ShopSiteOrderItem[] = [];
            const shippingMatch = orderXml.match(/<Shipping>([\s\S]*?)<\/Shipping>/i);
            if (shippingMatch) {
                const productsMatch = shippingMatch[1].match(/<Products>([\s\S]*?)<\/Products>/i);
                if (productsMatch) {
                    // Use indexOf for products too
                    const productsXml = productsMatch[1];
                    let productPos = 0;
                    while (true) {
                        const pStart = productsXml.indexOf('<Product>', productPos);
                        if (pStart === -1) break;
                        const pEnd = productsXml.indexOf('</Product>', pStart);
                        if (pEnd === -1) break;

                        const productXml = productsXml.substring(pStart, pEnd + 10);
                        productPos = pEnd + 10;

                        const itemSku = this.extractXmlValue(productXml, 'SKU');
                        const quantity = parseInt(this.extractXmlValue(productXml, 'Quantity') || '0', 10);
                        const itemPrice = parseFloat(this.extractXmlValue(productXml, 'ItemPrice') || '0');

                        if (itemSku) {
                            items.push({ sku: itemSku, quantity, price: itemPrice });
                        }
                    }
                }
            }

            if (orderNumber) {
                orders.push({
                    orderNumber,
                    orderDate,
                    grandTotal,
                    tax,
                    shippingTotal,
                    customerEmail,
                    items,
                });
            }
        }

        console.log(`[ShopSite] Parsed ${orders.length} orders from XML`);
        return orders;
    }

    private parseCustomersXml(xmlText: string): ShopSiteCustomer[] {
        const customers: ShopSiteCustomer[] = [];

        const customerMatches = xmlText.match(/<customer>([\s\S]*?)<\/customer>/gi);
        if (!customerMatches) return customers;

        for (const customerXml of customerMatches) {
            const email = this.extractXmlValue(customerXml, 'email');
            const firstName = this.extractXmlValue(customerXml, 'first_name');
            const lastName = this.extractXmlValue(customerXml, 'last_name');
            const billingAddress = this.extractXmlValue(customerXml, 'billing_address');
            const billingCity = this.extractXmlValue(customerXml, 'billing_city');
            const billingState = this.extractXmlValue(customerXml, 'billing_state');
            const billingZip = this.extractXmlValue(customerXml, 'billing_zip');

            if (email) {
                customers.push({
                    email,
                    firstName,
                    lastName,
                    billingAddress,
                    billingCity,
                    billingState,
                    billingZip,
                });
            }
        }

        return customers;
    }

    /**
     * Extract a value from XML using regex.
     * This is a simple approach that works for flat XML structures.
     */
    private extractXmlValue(xml: string, tag: string): string {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : '';
    }
}
