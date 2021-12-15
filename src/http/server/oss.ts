import http from "../index";
import api from "../api.js"
import {apiType} from "../api"
// 阿里云文件上传前获取签名新信息
export const aliOssFile = {
    /**
     * @description 阿里云文件上传前获取签名新信息
     * @returns {Promise<*>}
     */
     
    aliOssFileService:(baseUrl:string) => {
      return http.request({
        url: baseUrl+"/"+((api as apiType).aliOssFile as apiType).encryptParam,
        method: "get"
      })
    },
  
    /**
     * @description 手动上传图片至阿里云 oss 的接口
     */
    uploadImgToOss: (ossUrl:string, data: any) => {
      try {
        return http.request({
          url: ossUrl,
          method: "post",
          data,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
      } catch (e) {
        console.log("上传图片失败===", e);
        return false;
      }
    }
  };