import type {Metadata} from "next";
import "./globals.css";
import ThemeProvider from "./theme-provider";
export const metadata:Metadata={
 title:"Pagnier · Operações",
 applicationName:"Pagnier",
 description:"Produção, expedição e documentos da Pagnier em um só lugar.",
 icons:{
  icon:[{url:"/favicon.ico?v=pagnier-1",sizes:"16x16 32x32 48x48",type:"image/x-icon"},{url:"/favicon.svg?v=pagnier-1",sizes:"any",type:"image/svg+xml"}],
  shortcut:"/favicon.ico?v=pagnier-1",
  apple:{url:"/apple-touch-icon.png?v=pagnier-1",sizes:"180x180",type:"image/png"}
 }
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>}
