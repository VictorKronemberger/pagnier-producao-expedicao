import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Pagnier | Prioridades de produção",description:"Pedidos de venda, ordens e sequência definida pelo supervisor."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
