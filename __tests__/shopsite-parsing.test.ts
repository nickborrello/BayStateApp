import { ShopSiteClient } from '../lib/admin/migration/shopsite-client';

describe('ShopSite XML Parsing', () => {
    // @ts-ignore - Mock config is enough for testing private parsing methods
    const client = new ShopSiteClient({ storeUrl: 'https://example.com', merchantId: 'test', password: 'test' });

    describe('Product Parsing', () => {
        it('should parse products with lowercase tags', () => {
            const xml = `
                <products>
                    <product>
                        <sku>SKU123</sku>
                        <name>Test Product</name>
                        <price>19.99</price>
                        <description>A test product description</description>
                        <quantity_on_hand>10</quantity_on_hand>
                        <graphic>image.jpg</graphic>
                    </product>
                </products>
            `;
            const products = (client as any).parseProductsXml(xml);
            expect(products).toHaveLength(1);
            expect(products[0]).toMatchObject({
                sku: 'SKU123',
                name: 'Test Product',
                price: 19.99,
                description: 'A test product description',
                quantityOnHand: 10,
                imageUrl: 'image.jpg'
            });
        });

        it('should parse products with PascalCase tags (from DTD)', () => {
            const xml = `
                <Products>
                    <Product>
                        <SKU>SKU456</SKU>
                        <Name>Pascal Product</Name>
                        <Price>25.00</Price>
                        <Quantity>5</Quantity>
                        <Weight>2.5</Weight>
                        <Taxable>Yes</Taxable>
                    </Product>
                </Products>
            `;
            const products = (client as any).parseProductsXml(xml);
            expect(products).toHaveLength(1);
            expect(products[0]).toMatchObject({
                sku: 'SKU456',
                name: 'Pascal Product',
                price: 25.0,
                quantityOnHand: 5,
                weight: 2.5,
                taxable: true
            });
        });

        it('should handle CDATA values', () => {
            const xml = `
                <product>
                    <sku>SKU-CDATA</sku>
                    <name><![CDATA[Product with <Special> Characters]]></name>
                </product>
            `;
            const products = (client as any).parseProductsXml(xml);
            expect(products[0].name).toBe('Product with <Special> Characters');
        });
    });

    describe('Order Parsing', () => {
        it('should parse orders based on the DTD structure', () => {
            const xml = `
                <ShopSiteOrders>
                    <Order>
                        <OrderNumber>1001</OrderNumber>
                        <ShopSiteTransactionID>TX123</ShopSiteTransactionID>
                        <OrderDate>12/31/2025</OrderDate>
                        <Billing>
                            <Email>customer@example.com</Email>
                            <FullName>John Doe</FullName>
                            <Address>
                                <Street1>123 Main St</Street1>
                                <City>Boston</City>
                                <State>MA</State>
                                <Code>02108</Code>
                                <Country>US</Country>
                            </Address>
                        </Billing>
                        <Totals>
                            <GrandTotal>55.00</GrandTotal>
                            <Tax>
                                <TaxAmount>2.50</TaxAmount>
                            </Tax>
                            <ShippingTotal>
                                <Total>7.50</Total>
                            </ShippingTotal>
                        </Totals>
                        <Shipping>
                            <Products>
                                <Product>
                                    <SKU>SKU123</SKU>
                                    <Quantity>2</Quantity>
                                    <ItemPrice>22.50</ItemPrice>
                                </Product>
                            </Products>
                        </Shipping>
                    </Order>
                </ShopSiteOrders>
            `;
            const orders = (client as any).parseOrdersXml(xml);
            expect(orders).toHaveLength(1);
            expect(orders[0]).toMatchObject({
                orderNumber: '1001',
                customerEmail: 'customer@example.com',
                grandTotal: 55.00,
                tax: 2.50,
                shippingTotal: 7.50
            });
            expect(orders[0].items).toHaveLength(1);
            expect(orders[0].items[0]).toMatchObject({
                sku: 'SKU123',
                quantity: 2,
                price: 22.50
            });
        });
    });
});
