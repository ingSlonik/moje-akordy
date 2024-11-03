import process from "node:process";

export const location = process.env.NODE_ENV === "development" ? "http://localhost:1010" : "https://akordy.paulu.cz";
