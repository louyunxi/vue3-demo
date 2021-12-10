import { AxiosPromise, AxiosResponse } from "axios";
import { Interceptors } from "./interceptors";

// 请求配置
export class HttpServer {
  axios: any;
  // 获取axios实例
  constructor() {
    const interceptors=new Interceptors();
    this.axios = interceptors.getInterceptors();
    interceptors.init();
  }
  // 简单封装一下方法
  request(config: any): AxiosPromise {
    return new Promise((resolve, reject) => {
      this.axios(config).then((res: AxiosResponse) => {
        resolve(res);
      }).catch((err: any) => {
        reject(err)
      });
    });
  }
}

const http = new HttpServer()

export default http