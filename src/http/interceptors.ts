// 首先引入axios和上一步封装的cookie方法
import axios, { AxiosInstance } from "axios";
import {
  setToken,
  getToken,
  getTokenKey,
  removeToken,
} from "../utils/set-token";

export class Interceptors {
  instance: AxiosInstance;
  constructor() {
    this.instance = axios.create({
      baseURL: "",
      timeout: 10000,
    });
  }
  // 初始化拦截器
  init() {
    // 请求接口拦截器
    this.instance.interceptors.request.use(
      (config:any) => {
        // 判断一下是否有cookie 如果有的话则把cookie放入请求头中
        if (getToken()) {
          config.headers[getTokenKey()] = getToken();
        }
        return config;
      },
      (err) => {
        console.error(err);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        const res = response.data;
        return res;
      },
      (error) => {
        if (error.message === "Request failed with status code 500") {
          console.error("系统错误，请检查API是否正常！");
          return;
        }
        let code = -110;
        if (error && error.response && error.response.status) {
          code = error.response.status;
          // 登陆过期
          if (code === 401 || code === -3) {
            removeToken();
          }
        } else {
          console.error(error.message);
        }
        const err = { errCode: -110, errMsg: error.message || "Error" };
        return Promise.resolve(err);
      }
    );
  }
  // 返回一下
  getInterceptors() {
    return this.instance;
  }
}