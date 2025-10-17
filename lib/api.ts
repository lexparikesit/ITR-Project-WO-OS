import axios from "axios";
import Router from "next/router";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "", // kosong = relative (ke Next route)
  timeout: 20000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      Router.replace("/login");
    }
    return Promise.reject(err);
  }
);