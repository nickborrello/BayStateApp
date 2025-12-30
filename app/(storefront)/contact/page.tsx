import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
    title: "Contact Us",
    description: "Contact Bay State Pet & Garden Supply. Find our store hours, location, phone number, and email. We're always happy to help!",
    openGraph: {
        title: "Contact Us | Bay State Pet & Garden Supply",
        description: "Find our store hours, location, and contact information.",
    },
};

export default async function ContactPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 text-center">Contact Us</h1>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Store Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Store Hours
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-2">
                            <div className="flex justify-between">
                                <dt className="font-medium">Monday - Friday</dt>
                                <dd className="text-muted-foreground">8:00 AM - 6:00 PM</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="font-medium">Saturday</dt>
                                <dd className="text-muted-foreground">8:00 AM - 5:00 PM</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="font-medium">Sunday</dt>
                                <dd className="text-muted-foreground">10:00 AM - 4:00 PM</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {/* Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <address className="not-italic space-y-1">
                            <p className="font-medium">Bay State Pet & Garden Supply</p>
                            <p className="text-muted-foreground">123 Main Street</p>
                            <p className="text-muted-foreground">Anytown, MA 01234</p>
                        </address>
                    </CardContent>
                </Card>

                {/* Phone */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Phone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href="tel:+15551234567"
                            className="text-lg font-medium hover:underline"
                        >
                            (555) 123-4567
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                            Call us for product availability or questions
                        </p>
                    </CardContent>
                </Card>

                {/* Email */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href="mailto:info@baystatepetgarden.com"
                            className="font-medium hover:underline"
                        >
                            info@baystatepetgarden.com
                        </a>
                        <p className="text-sm text-muted-foreground mt-1">
                            We typically respond within 24 hours
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <Card className="mt-6">
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Have a question about a product or service? Give us a call or stop by -
                        we&apos;re always happy to help!
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
