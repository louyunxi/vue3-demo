import http from "../index";
import api from "../api.js"
import {apiType} from "../api"
export const getFarmInfo=(baseUrl:string,data:any)=> {
    return http.request({
        url: baseUrl+"/"+((api as apiType).govFarmController as apiType).getMap,
        method: "post",
        data
    })
}