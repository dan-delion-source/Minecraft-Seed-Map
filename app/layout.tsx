
import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
    title: "Minecraft Seed Explorer",
    description: "Explore Minecraft Java seeds, biomes, and structures with Cubiomes",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body >{children}</body>
        </html>
    );
}
