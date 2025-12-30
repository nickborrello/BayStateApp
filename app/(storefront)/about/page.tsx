import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Users, Heart } from 'lucide-react';

export const metadata: Metadata = {
    title: "About Us",
    description: "Learn about Bay State Pet & Garden Supply - a family-owned local store serving the community with quality pet supplies, garden tools, and farm products for decades.",
    openGraph: {
        title: "About Us | Bay State Pet & Garden Supply",
        description: "A family-owned local store serving the community with quality products and neighborly service.",
    },
};

export default async function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-8 text-center">About Us</h1>

            <div className="space-y-8">
                {/* History Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Our History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-gray dark:prose-invert">
                        <p>
                            Bay State Pet & Garden Supply has been serving our local community for decades.
                            What started as a small family operation has grown into the go-to destination
                            for pet supplies, garden tools, and farm products in the area.
                        </p>
                        <p>
                            Through the years, we&apos;ve stayed true to our roots - offering quality products,
                            honest advice, and the kind of personal service that only a local store can provide.
                        </p>
                    </CardContent>
                </Card>

                {/* Family/Team Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Family Owned & Operated
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-gray dark:prose-invert">
                        <p>
                            We&apos;re proud to be a family-owned business. Our team knows the products
                            we sell because we use them ourselves - on our own farms, in our own gardens,
                            and with our own pets.
                        </p>
                        <p>
                            When you shop with us, you&apos;re not just a customer - you&apos;re a neighbor.
                            We&apos;re here to help you find exactly what you need, whether it&apos;s the
                            right feed for your chickens or the perfect toy for your dog.
                        </p>
                    </CardContent>
                </Card>

                {/* Location Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Visit Us
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Stop by our store to see our full selection in person. Our friendly staff
                            is always happy to help you find what you need.
                        </p>
                    </CardContent>
                </Card>

                {/* Mission Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            Our Mission
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-gray dark:prose-invert">
                        <p>
                            To provide our community with quality pet, garden, and farm supplies
                            at fair prices, backed by knowledgeable service and neighborly care.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
