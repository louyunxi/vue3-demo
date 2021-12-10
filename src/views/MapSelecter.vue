<template>
  <div class="MapSelecter">
    <div id="map"></div>
  </div>
</template>

<script lang="ts">
interface optionType {
  color: string;
  fillColor: string;
  fillOpacity: number;
  className: string;
  weight: number;
}
/* eslint-disable no-undef */
import { defineComponent, onMounted } from "vue";
import { useRoute } from "vue-router";
import { setToken } from "../utils/set-token";
import { getFarmInfo } from "../http/server/map";
import L, { map,Map,Marker,layerGroup,LayerGroup, Point,PointTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
type queryType = {
  data: string;
};
type landItemType = {
  companyId: number;
  cropList: Array<Record<string, any>>;
  farmId: number;
  fillColor: string;
  fillOpacity: string;
  id: number;
  landAcre: number | string;
  landAcreUnit: number;
  landCenterLat: string;
  landCenterLng: string;
  landName: string;
  landStatus: number;
  landTypeId: number;
  landTypeImgUrl: string;
  landTypeName: string;
  landZoom: string;
  path: string;
  shGisDkid: string;
  strokeColor: string;
  strokeOpacity: string;
  strokeWeight: string;
};
type iconOption={
    wh: Array<string | number>
    anchor: Array<string | number>
    markerImage: string
    center: Array<string | number>
}
const markerMap={
  noselected: require('../assets/images/map/marker_0.png'),
  selected: require('../assets/images/map/marker_1.png'),
  disable: require('../assets/images/map/marker_disable.png')
}
export default defineComponent({
  name: "MapSelecter",
  components: {},
  data() {
    return {};
  },
  setup() {
    const initMap=(el: string | HTMLElement):Map=>{
      let map:Map = L.map(el, {
        minZoom: 3,
        maxZoom: 14,
        center: [39.550339, 116.114129],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        crs: L.CRS.EPSG3857,
      });
      L.tileLayer(
        "http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
      ).addTo(map);
      L.tileLayer(
        "https://map.snkoudai.com/maps/vt/lyrs=s&hl=zh-CN&gl=cn&scale=1&x={x}&y={y}&z={z}"
      ).addTo(map);
      return map;
    };
    const mapEvent = (map:Record<string, any>): void => {
      // 地图点击
      map.on("click", (e: Record<string, any>) => {
        console.log(e);
      });
      // 地图缩放
      /* map.on('zoomstart', function () {
                $('.leaflet-map-pane canvas.leaflet-canvas-icon-layer').css('visibility', 'hidden');
            });
            map.on('zoomend', function () {
                $('.leaflet-map-pane canvas.leaflet-canvas-icon-layer').css('visibility', 'visible');
            }); */
      map.on("zoom", (e: Record<string, any>) => {
        console.log(e);
        //根据zoom变化 更新marker显示
        //return refreshMarker(map, false, e.target._zoom);
      });
    }
    const hasPathLandfn = (areaList: Array<landItemType>): number => {
      var haspathland = 0;
      areaList.forEach((landData) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        haspathland++;
      });
      return haspathland;
    };
    const initLandAndMarker = (
      map: Map,
      areaList: Array<landItemType>,
      allMarker:Array<Marker>,
      allMarkerLayer:LayerGroup,
      zoom = 14,
      onlyMarker = false
    ):unknown => {
      let allpolygon: Array<any> = [];
      //绘制多边形地块
      if (!onlyMarker) {
        areaList.forEach((landData) => {
          if (
            !landData["path"] ||
            !(JSON.parse(landData["path"]) instanceof Array)
          )
            return null;
          let landPath = JSON.parse(landData["path"]);
          let landPolygon = initPolygon(
            landPath,
            landData["fillColor"],
            landData["fillColor"],
            0.3
          );
          allpolygon.push(landPolygon);
        });
        let polygonsLayer = L.layerGroup(allpolygon); //地块轮廓 合并成组 一次性添加
        polygonsLayer.addTo(map);
        return polygonsLayer;
      }

      //初始化 选择作物图标层
			allMarker.length && clearMarkersFromLayer(allMarkerLayer, allMarker); //清空已绘制marker
			//绘制选择作物图标
			areaList.forEach((landData:landItemType) => {
				if (!landData['path'] || !(JSON.parse(landData['path']) instanceof Array)) return;
				var landPath = JSON.parse(landData['path']);
				var markerImages = landData['cropList'].map(item => item['imgUrl']);
				var markerCenter = [landData['landCenterLat'], landData['landCenterLng']];
				//是否是小于两亩的地块
				var unit = [0, 666.7, 66.67, 1];
				var landAcre = unit[landData['landAcreUnit']] * parseFloat(landData['landAcre'] as string);
				var isSmallArea = landAcre < 1333.5 ? true : false; //是否为小于2亩的小地块   //marker显示 特殊处理
				var landIconOptions = getLandMarkerOptions(zoom, markerCenter, markerImages, isSmallArea, 1); //获取单个地块下 所有图标 样式
				var landMarker = landIconOptions.map((option:Record<string,any>) => {
					return initMarker(option.markerImage, option.wh, option.anchor, option.center);
				});
				allMarker.push(...landMarker);
      }
    };
    const initPolygon = (
      path: Array<any>,
      bordercolor: string,
      fillcolor: string,
      fillOpacity: number
    ) => {
      var option: optionType = {
        color: bordercolor || "#64C3A4",
        fillColor: fillcolor || "#64C3A4",
        fillOpacity: fillOpacity || 0.5,
        className: "polygonbox",
        weight: 2,
      };
      var polygon = L.polygon(path, option);
      return polygon;
    };
    const initMarker=(iconUrl:string, iconSize:Point | PointTuple | undefined, iconAnchor:Point | PointTuple | undefined, centerlatlng:Array<number>)=>{
			return L.marker(
				{
					lat: centerlatlng[0],
					lng: centerlatlng[1],
				},
				{
					icon: L.icon({
						iconUrl: iconUrl,
						iconSize: iconSize, //大小
						iconAnchor: iconAnchor, //偏移位置
					}),
				}
			);
		};
    const initMapPosition = async (
      map: Record<string, any>,
      allLandList: Array<landItemType> = []
    ): Promise<void> => {
      var otherGroupLandList = allLandList.filter(
        (item) =>
          item.landName !== "演示地块（可删除）" &&
          item["path"] &&
          JSON.parse(item["path"]) instanceof Array
      );
      var demoLandList = allLandList.filter(
        (item) =>
          item.landName === "演示地块（可删除）" &&
          item["path"] &&
          JSON.parse(item["path"]) instanceof Array
      );
      if (otherGroupLandList.length) {
        //2. 当前组 无地块 其他组有地块 一农场所有地块为中心 (刨除演示地块)
        await initLandsPosition(map, otherGroupLandList);
      } else if (!otherGroupLandList.length && demoLandList.length) {
        //3. 农场无地块轮廓 只有演示地块 演示地块为中心
        await initLandsPosition(map, demoLandList);
      } else {
        //4. 农场无地块轮廓 农场地址坐标为中心
        //没有轮廓地块 定位到农场位置
        /* var {farmDetailVO} = await this.getFarmInfo(this.pageParams.company, this.pageParams.farm);
				if (!farmDetailVO) return;
				await goFarmPosition(this.map, farmDetailVO, mapTools.addressGetLocation.bind(mapTools)); */
      }
    };
    const initLandsPosition = async (
      map: Record<string, any>,
      landlist: Array<landItemType>
    ): Promise<void> => {
      //初始化单个、多个地块位置显示；新增需求：大于一个地块轮廓时就考虑将演示地块的轮廓不考虑展示在视野内
      let allpointer: any = [];
      landlist.forEach((landData) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        var landPath = JSON.parse(landData["path"]);
        allpointer.push(...landPath);
      });
      if (!allpointer.length) return;
      var bigpolygon = L.polygon(allpointer, {}).getBounds();
      var allzoom = map.getBoundsZoom(bigpolygon);
      var allcenter = bigpolygon.getCenter();
      map.setView({ lat: allcenter.lat, lng: allcenter.lng }, allzoom);
    };
    const clearMarkersFromLayer=(markerLayer:LayerGroup,allMarker:Marker[] = [])=>{
			allMarker.forEach(function (marker:Marker) {
				markerLayer.removeLayer(marker);
			});
			allMarker.length = 0;
		}
    const getLandMarkerOptions=(zoom:number, center:Array<number|string> | null, imagesUrls:string, isSmallArea:boolean, marktype:number = 0)=>{
			//marker 数据整合
			if (!imagesUrls.length) return [];
      type iconitemType={
        iconsrc:Array<string>
        center:Array<number|string> | null
      }
			var iconitem:iconitemType = {iconsrc: [], center: null};
			iconitem.center = center;
			//marker图标 图片圆形处理
      var imgsrc:string='';
			for (var j = 0; j < imagesUrls.length; j++) {
				imgsrc= markerImageHander(imagesUrls[j], 48);
				iconitem.iconsrc.push(imgsrc);
			}
			//数量太多处理
			var iconlen = iconitem['iconsrc'].length;
			iconlen = iconlen > 4 ? 4 : iconlen;
			var markerOptions = [];
			for (var i = 0; i < iconlen; i++) {
				var aliimg = iconitem['iconsrc'][i];
				var markerPosAnchor = computeMarkerPosAnchor(zoom, iconlen, i, isSmallArea, marktype);
				markerOptions.push({
					wh: markerPosAnchor[0], //marker宽高
					anchor: markerPosAnchor[1], //地块marker 偏移
					markerImage: aliimg, //地块marker 图标
					center: iconitem['center'], //地块marker 坐标
				});
			}
			return markerOptions;
		}
    const computeMarkerPosAnchor=(zoom:number, markerlen:number, markerindex:number, isSmallArea:boolean, markerType:number = 0)=>{
			//图标 不同缩放等级 位置和偏移量计算
			//计算marker位置大小 根据中心点，marker数量，序号 综合计算位置以及大小
			var iconposArr = [ [], [[12, 12]], [ [24, 12], [0, 12], ], [ [12, 24], [0, 0], [24, 0], ], [ [24, 24], [0, 24], [0, 0], [24, 0], ], ]; //作物marker (1,2,3,4个图标展示位置映射)

			var iconposPlusArr = [ [], [[12, 30]], [ [30, 12], [-6, 12], ], [ [12, 26], [-2, 0], [26, 0], ], [ [24, 24], [0, 24], [0, 0], [24, 0], ], ]; 
      //针对上方有select图标情况的 作物图标展示 (1,2,3,4个图标展示位置映射)
			//普通作物 marker 层级与大小映射
			var zoomWithWidthMap = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 4, 10: 4, 11: 4, 12: 6, 13: 8, 14: 8, 15: 8, 16: 12, 17: 16, 18: 24, 19: 32, 20: 40, 21: 48, 22: 56};
			//作物 小marker 层级与大小映射
			var zoomWithWidthSmallMap = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 4, 10: 4, 11: 4, 12: 6, 13: 6, 14: 6, 15: 6, 16: 8, 17: 8, 18: 12, 19: 18, 20: 36, 21: 42, 22: 48};
			//select marker 层级与大小映射
			var zoomWithWidthSelectMap = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 2, 9: 4, 10: 4, 11: 4, 12: 4, 13: 4, 14: 6, 15: 6, 16: 8, 17: 10, 18: 16, 19: 20, 20: 30, 21: 42, 22: 48};
      type posArrType=Array<Array<Array<number>> | Array<Array<number>> | Array<number>>
      function getPosArrType(posArr:posArrType,width:number):posArrType{
				return posArr.map((item:posArrType) => {
					item.map(itemplus) => {
						itemplus[0] = parseInt((itemplus[0] * width) / 24);
						itemplus[1] = parseInt((itemplus[1] * width) / 24);
						return itemplus;
					});
					return item;
				});
			}
      switch (markerType) {
				case 1: //显示在select marker下面的作物marker （会整体向上偏移一些）
					var width:number = isSmallArea ? Reflect.get(zoomWithWidthSmallMap,zoom) : Reflect.get(zoomWithWidthMap,zoom);
					var iconposArrright = getPosArr(iconposPlusArr,width);
					break;
				case 2: //select marker  （会整体向下偏移一些）
					var width:number = Reflect.get(zoomWithWidthSelectMap,zoom);
					var iconposArrright = getPosArr(iconposArr,width);
					break;
				default:
					//普通作物marker
          
					var width:number = isSmallArea ? Reflect.get(zoomWithWidthSmallMap,zoom) : Reflect.get(zoomWithWidthMap,zoom);
					var iconposArrright = getPosArr(iconposArr,width);
					break;
			}
			var anchor = iconposArrright[markerlen][markerindex];
			return [[width, width], anchor];
		}
    const markerImageHander=(imgsrc:string, radius:number):string=>{
			radius = radius || 100;
			if (imgsrc && imgsrc.indexOf('.aliyuncs.com/') !== -1) {
				var newimgstr = imgsrc + '?x-oss-process=image/resize,m_fill,h_' + radius + ',w_' + radius + '/rounded-corners,r_' + radius + '/format,png';
				return newimgstr;
			} else {
				return imgsrc;
			}
		}
    /* const refreshMarker=(map:<Record<string, any>, onlySelectMaker:boolean = false, zoom:number) => {
			zoom = zoom || map.getZoom();
			!onlySelectMaker && initLandAndMarker(map, landList, zoom, true);
			initSelectLandAndMarker(map, this.landList, zoom, true);
		} */
    /* const goFarmPosition=async (map, farmDetailVO, addressGetLocation) => {
			var address = '';
			address += farmDetailVO.provinceName ? farmDetailVO.provinceName : '';
			address += farmDetailVO.cityName ? farmDetailVO.cityName : '';
			address += farmDetailVO.countyName ? farmDetailVO.countyName : '';
			address += farmDetailVO.farmAddress ? farmDetailVO.farmAddress : '';
			var result = await addressGetLocation(address);
			if (result) {
				map.setView({lat: result[0], lng: result[1]}, 13);
			}
		}; */
    const getQuery = (params: queryType): string => {
      if (!params || typeof params !== "string") return "";
      var data: string = (params as queryType).data;
      return eval(decodeURIComponent(data));
    };

    document.title = "在地图上选择地块";
    onMounted(async () => {
      const route = useRoute();
      const query = route.query;
      let uni = (window as any).uni;
      console.log(query);
      document.addEventListener("UniAppJSBridgeReady", function() {
        uni.webView.getEnv((res: any) => {
          console.log("当前环境：" + JSON.stringify(res));
        });
        //uni.openLocation
        console.log(uni);
        uni.postMessage({
          data: {
            name: "11111111",
            age: 31,
            list: [
              { name: "5435", age: 334 },
              { name: "5435", age: 334 },
              { name: "5435", age: 334 },
            ],
          },
        });
      });

      setToken("gov_token_265_1_65f682a182864130af155ec879e062eb");
      var result: any = await getFarmInfo({
        farmId: "3498",
      });
      let landList = result.obj.landAndPlantPlanListVOS;
      console.log(result);
      var map:Map = initMap('map');

      initMapPosition(map, landList);
      mapEvent(map);
      //渲染地块和marker点
      var nowZoom: number = map.getZoom();
      const hasPathLandNum = hasPathLandfn(landList);
      let allMarkerLayer:LayerGroup = L.layerGroup([]).addTo(map);
      let allMarker:Array<Marker>=[];
      //allMarkerLayer._canvas.className += ' cropMarkerLayer'; //marker 层canvas 加样式
      let layer = initLandAndMarker(map, landList,allMarker,allMarkerLayer, nowZoom);
      console.log(layer);
    });
  },
});
</script>
<style scoped lang="stylus">
.MapSelecter{
  width:100vw;
  height:100vh;
  background-color:#fff;
  #map{
    width: 100%;
    height: 100%;
  }
}
</style>
