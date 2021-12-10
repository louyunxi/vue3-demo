import http from "../index";
import api from "../api.js"
import {apiType} from "../api"
export const getFarmInfo=(data: any)=> {
    return http.request({
        url: ((api as apiType).govFarmController as apiType).getMap,
        method: "post",
        data
    })
}
