import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { WishlistProvider } from "./components/WishlistContext";
import { CartProvider } from "./components/CartContext";
import { CurrencyProvider } from "./components/CurrencyContext"; // ✅ ضيفها هنا

import "flag-icons/css/flag-icons.min.css";
import "./index.css";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <CurrencyProvider> {/* ✅ خليها هنا */}
          <WishlistProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </WishlistProvider>
        </CurrencyProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
