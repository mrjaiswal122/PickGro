
import {ReactNode} from "react";



export default function AuthLayout({
    children,
  }: {
    children:ReactNode;
  }) {
    
    return (
        <>
      
       
         <div className="dark:bg-black bg-theme-light" >

        {children}
         </div>
    
        </>

    );
  }

