import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Meera's Savings Circle - Authorize Once",
  description: "Eleven colleagues, weekly contributions, no chasing required",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
