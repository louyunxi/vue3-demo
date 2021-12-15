<template>
  <div class="MapSelecter">
    <div id="map"></div>
    <Button
      @click="submit"
      type="primary"
      class="customize-submit"
      :class="{ noselect: !Boolean(landLen) }"
      >{{ Boolean(landLen) ? `已选择${landLen}个地块` : "请选择地块" }}</Button
    >
  </div>
</template>

<script lang="ts">
/* eslint-disable no-undef */
import {
  defineComponent,
  ref,
  reactive,
  toRefs,
  onMounted,
  watchEffect,
} from "vue";
import { Button } from "vant";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import {
  point as turfPoint,
  polygon as turfPolygon,
  booleanPointInPolygon,
  pointOnFeature,
} from "@turf/turf";
import { setToken } from "../utils/set-token";
import { getFarmInfo } from "../http/server/map";
import L, {
  Map,
  Marker,
  LayerGroup,
  PointExpression,
  Polygon
} from "leaflet";
import "leaflet/dist/leaflet.css";
import { Toast } from "vant";
interface optionType {
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
}
type queryType = {
  baseUrl: string;
  token: string;
  farmId: string;
  landIds?: Array<number>;
  location?: Array<number>;
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
  disable: boolean;
  select: boolean;
  markerCenter: Array<string>;
};
interface selectLandType {
  landIds: number[];
  landLen: number;
}
const markerMap = {
  noselected: require("../assets/images/map/marker_0.png"),
  selected: require("../assets/images/map/marker_1.png"),
  disable: require("../assets/images/map/marker_disable.png"),
};
export default defineComponent({
  name: "MapSelecter",
  data() {
    return {};
  },
  setup() {
    document.title = "在地图上选择地块";
    const getQuery = (data: string): any => {
      if (!data) return "";
      return JSON.parse(decodeURIComponent(data));
    };
    /* document.addEventListener("UniAppJSBridgeReady", function() {
      let uni = (window as any).uni;
      uni.webView.getEnv((res: any) => {
        console.log("当前环境：" + JSON.stringify(res));
      });
    }); */
    let landList: Array<landItemType> = reactive([]);
    let selectLands: selectLandType = reactive({
      landIds: [],
      landLen: 0,
    });
    let selectLandLayer = L.layerGroup([]);
    let selectMarker: Array<Marker> = [];
    let selectMarkerLayer: LayerGroup = L.layerGroup([]);
    onMounted(async () => {
      const route = useRoute();
      const queryStr: string =
        (route.query && (route.query.data as string)) || "";
      let query: queryType = getQuery(queryStr);
      if (!query.token || !query.farmId) return;
      let map:Map | undefined=await initModules(
        query.baseUrl,
        query.token,
        query.farmId,
        query.location
      );
      if(!map) return;
      if (
        Reflect.has(query, "landIds") &&
        Array.isArray(query.landIds) &&
        query.landIds.length
      ) {
        landList.map((item) => {
          if ((query.landIds as Array<number>).includes(item.id)) {
            item.select = true;
          }
        });
        initSelectLandAndMarker(
          false,
          landList,
          selectLandLayer,
          selectMarker,
          selectMarkerLayer,
          map.getZoom()
        );
      }
      watchEffect(() => {
        var selects = (landList as Array<landItemType>).filter(
          (item) => item.select
        );
        selectLands.landIds = selects.map((item) => item.id);
        selectLands.landLen = selects.length;
      });
    });
    function submit() {
      console.log(selectLands.landIds);
      postMessage(selectLands.landIds);
    }
    const initModules = async (
      baseUrl: string,
      token: string,
      farmId: string,
      location: number[] | undefined
    ):Promise<Map | undefined> => {
      // 拉取数据
      setToken(token);
      var result: any = await getFarmInfo(baseUrl, { farmId: farmId });
      let lands: Array<landItemType> = result.obj.landAndPlantPlanListVOS;
      lands.map((item: landItemType) => {
        item.select = false;
        item.disable = false;
      });
      landList.push(...lands);
      // 初始化地图
      var map: Map = initMap("map");
      // 地图聚焦
      const hasPathLandNum = hasPathLandfn(landList);
      if (!hasPathLandNum) {
        Toast("当前主体未绘制任何地块");
        return;
      }
      location &&
        location.length &&
        initUserLocationPopup(map, location[1], location[0]);
      initMapPosition(map, landList);
      selectLandLayer.addTo(map);
      selectMarkerLayer.addTo(map);
      // 中心点坐标矫正
      landList.forEach((landData: landItemType) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        if (
          !thePointInPolygon(
            [JSON.parse(landData["path"])],
            [
              parseFloat(landData["landCenterLat"]),
              parseFloat(landData["landCenterLng"]),
            ]
          )
        ) {
          var center = pointOnFeature(
            turfPolygon([JSON.parse(landData["path"])])
          );
          landData["landCenterLat"] = center.geometry.coordinates[0].toString();
          landData["landCenterLng"] = center.geometry.coordinates[1].toString();
        }
      });
      //渲染地块和marker点
      var nowZoom: number = map.getZoom();

      // 展示层 作物marker land
      let markersLayer: LayerGroup = L.layerGroup([]).addTo(map);
      //绘制作物图标
      var cropmarkers = undateMarkers(
        true,
        false,
        landList,
        markersLayer,
        nowZoom
      );
      // 选择层 选择marker 选中land
      var [selectlands, selectmarkers] = initSelectLandAndMarker(
        true,
        landList,
        selectLandLayer,
        selectMarker,
        selectMarkerLayer,
        nowZoom
      );
      // 点击可选图层 点击事件绑定
      const activeLandNoShakeFn = activeLandNoShake();
      ([...cropmarkers, ...selectlands, ...selectmarkers] as [
        Polygon | Marker
      ]).map((landPolygon: Polygon | Marker) => {
        landPolygon.on("click", function(e: any) {
          var flagId = e.target.flagId;
          var landId = flagId.split("_")[0];
          activeLandNoShakeFn(
            landId,
            landList,
            selectLandLayer,
            selectMarker,
            selectMarkerLayer,
            map.getZoom()
          );
        });
      });
      mapEvent(map, landList, markersLayer, selectMarkerLayer);
      return map;
    };
    const initMap = (el: string | HTMLElement): Map => {
      let map: Map = L.map(el, {
        minZoom: 3,
        maxZoom: 18,
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
    const mapEvent = (
      map: Map,
      landList: Array<landItemType>,
      cropMarkersLayer: LayerGroup,
      selectMarkersLayer: LayerGroup
    ): void => {
      // 地图点击
      map.on("click", (e: Record<string, any>) => {
        console.log(e.latlng);
      });
      map.on("zoom", (e: Record<string, any>) => {
        //根据zoom变化 更新marker显示
        undateMarkers(false, false, landList, cropMarkersLayer, e.target._zoom);
        undateMarkers(
          false,
          true,
          landList,
          selectMarkersLayer,
          e.target._zoom
        );
        return;
      });
    };
    const hasPathLandfn = (landList: Array<landItemType>): number => {
      var haspathland = 0;
      landList.forEach((landData) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        haspathland++;
      });
      return haspathland;
    };
    const initSelectLandAndMarker = (
      isInit = false,
      landList: Array<landItemType>,
      landLayer: LayerGroup,
      markers: Array<Marker>,
      markersLayer: LayerGroup,
      zoom = 14
    ): [Array<Polygon>, Array<Marker>] => {
      //初始化选择层 制多边形对象
      let allpolygon: Array<Polygon> = updateLands(isInit, landList, landLayer);
      allpolygon.map((polygon) => {
        (polygon as any).type = "polygon";
        landLayer.addLayer(polygon);
      });
      //初始化 选择作物图标层
      //markers.length && clearMarkersFromLayer(markersLayer, markers); //清空已绘制marker
      //绘制选择按钮
      markers = undateMarkers(isInit, true, landList, markersLayer, zoom);
      return [allpolygon, markers];
    };
    const updateLands = (
      isInit = false,
      landList: Array<landItemType>,
      landLayer?: LayerGroup | undefined
    ): Array<Polygon> => {
      //初始化选择层 制多边形对象
      let allpolygon: Array<Polygon> = [];
      landList.forEach((landData) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        var landPath = JSON.parse(landData["path"]);
        var fillColor = "rgba(0,0,0,0)",
          opacity = 0.3,
          borderColor = "#000",
          weight = 2;
        if (landData["disable"]) {
          fillColor = "#fff";
          borderColor = "rgba(0,0,0,0.5)";
          fillColor = "rgba(0,0,0,0.5)";
        } else if (landData["select"]) {
          fillColor = landData["fillColor"];
          borderColor = "rgba(255,255,255,0.8)";
          weight = 3;
          opacity = 0.7;
        } else {
          fillColor = landData["fillColor"];
          borderColor = landData["fillColor"];
        }
        var landPolygon: Polygon | undefined;
        if (isInit) {
          landPolygon = initPolygon(
            landPath,
            borderColor,
            fillColor,
            opacity,
            weight
          );
        } else {
          var landPolygons: Array<Polygon | any> =
            (landLayer && landLayer.getLayers()) || [];
          var polygon = landPolygons.find((polygon) => {
            return polygon.flagId === landData.id.toString();
          });
          landPolygon = updatePolygon(
            polygon,
            landPath,
            borderColor,
            fillColor,
            opacity,
            weight
          );
        }
        let flagId = `${landData.id}`;
        (landPolygon as any).flagId = flagId;
        allpolygon.push(landPolygon);
      });
      return allpolygon;
    };
    const undateMarkers = (
      isInit = false,
      isSelectMarker = false,
      landList: Array<landItemType>,
      markersLayer: LayerGroup,
      zoom = 14
    ): Array<Marker> => {
      let markers: Array<Marker | any> = markersLayer.getLayers() || [];
      //绘制选择按钮
      landList.forEach((landData) => {
        if (
          !landData["path"] ||
          !(JSON.parse(landData["path"]) instanceof Array)
        )
          return;
        //绘制地块种植物 marker点
        var markerImages: Array<string> | undefined;
        if (isSelectMarker) {
          markerImages = [markerMap.noselected];
          if (landData["select"]) {
            markerImages = [markerMap.selected];
          }
          if (landData["disable"]) {
            markerImages = [markerMap.disable];
          }
        } else {
          markerImages = landData["cropList"].map((item) => item["imgUrl"]);
        }
        var markerCenter = [
          landData["landCenterLat"],
          landData["landCenterLng"],
        ];
        if (landData.markerCenter) {
          markerCenter = landData.markerCenter;
        }
        //获取单个地块下 所有图标 样式
        var landIconOptions = getLandMarkerOptions(
          zoom,
          markerCenter,
          markerImages,
          false,
          isSelectMarker ? 2 : 1
        );
        //初始化单个地块下 所有图标
        if (isInit) {
          var landMarker = landIconOptions.map((option, index) => {
            var marker = initMarker(
              option.markerImage,
              option.wh,
              option.anchor,
              option.center as Array<number>
            );
            markersLayer.addLayer(marker);
            let flagId = `${landData.id}_${index}`;
            (marker as any).flagId = flagId;
            return marker;
          });
          markers.push(...landMarker);
        } else {
          landIconOptions.map((option, index) => {
            let flagId = `${landData.id}_${index}`;
            var tempMarker: Marker | undefined = markers.find(
              (item) => (item as any).flagId === flagId
            );
            if (!tempMarker) return;
            updateMarker(
              tempMarker,
              option.markerImage,
              option.wh,
              option.anchor,
              option.center as Array<number>
            );
          });
        }
      });
      return markers;
    };
    const initPolygon = (
      path: Array<any>,
      bordercolor: string,
      fillcolor: string,
      fillOpacity: number,
      weight: number
    ) => {
      var option: optionType = {
        color: bordercolor || "#64C3A4",
        fillColor: fillcolor || "#64C3A4",
        fillOpacity: fillOpacity || 0.5,
        weight: weight || 2,
      };
      var polygon: Polygon = L.polygon(path, option);
      return polygon;
    };
    const updatePolygon = (
      polygon: Polygon,
      path: Array<any>,
      bordercolor: string,
      fillcolor: string,
      fillOpacity: number,
      weight: number
    ): Polygon => {
      var option: optionType = {
        color: bordercolor || "#64C3A4",
        fillColor: fillcolor || "#64C3A4",
        fillOpacity: fillOpacity || 0.5,
        weight: weight || 2,
      };
      polygon.setLatLngs(path);
      polygon.setStyle(option);
      return polygon;
    };
    const initMarker = (
      iconUrl: string,
      iconSize: Array<number>,
      iconAnchor: Array<number>,
      centerlatlng: Array<number>
    ) => {
      return L.marker(
        {
          lat: centerlatlng[0],
          lng: centerlatlng[1],
        },
        {
          icon: L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize as PointExpression, //大小
            iconAnchor: iconAnchor as PointExpression, //偏移位置
          }),
        }
      );
    };
    const updateMarker = (
      marker: Marker,
      iconUrl: string,
      iconSize: Array<number>,
      iconAnchor: Array<number>,
      centerlatlng: Array<number>
    ) => {
      marker.setLatLng({
        lat: centerlatlng[0],
        lng: centerlatlng[1],
      });
      marker.setIcon(
        L.icon({
          iconUrl: iconUrl,
          iconSize: iconSize as PointExpression, //大小
          iconAnchor: iconAnchor as PointExpression, //偏移位置
        })
      );
      return marker;
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
    const getLandMarkerOptions = (
      zoom: number,
      center: Array<number | string> | null,
      imagesUrls: Array<string>,
      isSmallArea: boolean,
      marktype = 0
    ) => {
      //marker 数据整合
      if (!imagesUrls.length) return [];
      type iconitemType = {
        iconsrc: Array<string>;
        center: Array<number | string> | null;
      };
      var iconitem: iconitemType = { iconsrc: [], center: null };
      iconitem.center = center;
      //marker图标 图片圆形处理
      var imgsrc = "";
      for (var j = 0; j < imagesUrls.length; j++) {
        imgsrc = markerImageHander(imagesUrls[j], 48);
        iconitem.iconsrc.push(imgsrc);
      }
      //数量太多处理
      var iconlen = iconitem["iconsrc"].length;
      iconlen = iconlen > 4 ? 4 : iconlen;
      var markerOptions = [];
      for (var i = 0; i < iconlen; i++) {
        var aliimg = iconitem["iconsrc"][i];
        var markerPosAnchor = computeMarkerPosAnchor(
          zoom,
          iconlen,
          i,
          isSmallArea,
          marktype
        );
        markerOptions.push({
          wh: markerPosAnchor[0], //marker宽高
          anchor: markerPosAnchor[1], //地块marker 偏移
          markerImage: aliimg, //地块marker 图标
          center: iconitem["center"], //地块marker 坐标
        });
      }
      return markerOptions;
    };
    const computeMarkerPosAnchor = (
      zoom: number,
      markerlen: number,
      markerindex: number,
      isSmallArea: boolean,
      markerType = 0
    ): Array<Array<number>> => {
      //图标 不同缩放等级 位置和偏移量计算
      //计算marker位置大小 根据中心点，marker数量，序号 综合计算位置以及大小
      var iconposArr = [
        [],
        [[12, 12]],
        [
          [24, 12],
          [0, 12],
        ],
        [
          [12, 24],
          [0, 0],
          [24, 0],
        ],
        [
          [24, 24],
          [0, 24],
          [0, 0],
          [24, 0],
        ],
      ]; //作物marker (1,2,3,4个图标展示位置映射)

      var iconposPlusArr = [
        [],
        [[12, 30]],
        [
          [30, 12],
          [-6, 12],
        ],
        [
          [12, 26],
          [-2, 0],
          [26, 0],
        ],
        [
          [24, 24],
          [0, 24],
          [0, 0],
          [24, 0],
        ],
      ];
      //针对上方有select图标情况的 作物图标展示 (1,2,3,4个图标展示位置映射)
      //普通作物 marker 层级与大小映射
      var zoomWithWidthMap = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 2,
        9: 4,
        10: 4,
        11: 4,
        12: 6,
        13: 8,
        14: 8,
        15: 8,
        16: 12,
        17: 16,
        18: 24,
        19: 32,
        20: 40,
        21: 48,
        22: 56,
      };
      //作物 小marker 层级与大小映射
      var zoomWithWidthSmallMap = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 2,
        9: 4,
        10: 4,
        11: 4,
        12: 6,
        13: 6,
        14: 6,
        15: 6,
        16: 8,
        17: 8,
        18: 12,
        19: 18,
        20: 36,
        21: 42,
        22: 48,
      };
      //select marker 层级与大小映射
      var zoomWithWidthSelectMap = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 2,
        9: 4,
        10: 4,
        11: 4,
        12: 4,
        13: 4,
        14: 6,
        15: 6,
        16: 8,
        17: 10,
        18: 16,
        19: 20,
        20: 30,
        21: 42,
        22: 48,
      };
      type posArrType = Array<Array<Array<Array<number>> | Array<number>>>;
      var width = 0,
        iconposArrright = [];
      switch (markerType) {
        case 1: //显示在select marker下面的作物marker （会整体向上偏移一些）
          width = isSmallArea
            ? Reflect.get(zoomWithWidthSmallMap, zoom)
            : Reflect.get(zoomWithWidthMap, zoom);
          iconposArrright = getPosArr(iconposPlusArr, width);
          break;
        case 2: //select marker  （会整体向下偏移一些）
          width = Reflect.get(zoomWithWidthSelectMap, zoom);
          iconposArrright = getPosArr(iconposArr, width);
          break;
        default:
          //普通作物marker
          width = isSmallArea
            ? Reflect.get(zoomWithWidthSmallMap, zoom)
            : Reflect.get(zoomWithWidthMap, zoom);
          iconposArrright = getPosArr(iconposArr, width);
          break;
      }
      var anchor: number[] = iconposArrright[markerlen][markerindex];
      return [[width, width], anchor];
      function getPosArr(posArr: posArrType, width: number): any {
        return posArr.map((item: Array<any>): any => {
          item.map((itemplus: Array<number>) => {
            itemplus[0] = parseInt(((itemplus[0] * width) / 24).toString());
            itemplus[1] = parseInt(((itemplus[1] * width) / 24).toString());
            return itemplus;
          });
          return item;
        });
      }
    };
    const markerImageHander = (imgsrc: string, radius: number): string => {
      radius = radius || 100;
      if (imgsrc && imgsrc.indexOf(".aliyuncs.com/") !== -1) {
        var newimgstr =
          imgsrc +
          "?x-oss-process=image/resize,m_fill,h_" +
          radius +
          ",w_" +
          radius +
          "/rounded-corners,r_" +
          radius +
          "/format,png";
        return newimgstr;
      } else {
        return imgsrc;
      }
    };
    const thePointInPolygon = (path: Array<any>, point: Array<number>) => {
      return booleanPointInPolygon(turfPoint(point), turfPolygon(path));
    };
    const initUserLocationPopup = (
      map: Map,
      lat: number,
      lng: number
    ): void => {
      L.popup({
        className: "user-location",
        closeButton: false,
        closeOnClick: false,
      })
        .setLatLng({ lon: lng, lat: lat } as any)
        .setContent(`<img src="${require("../assets/images/map/user.png")}"/>`)
        .openOn(map);
    };
    const postMessage = (data: Array<number>) => {
      let uni = (window as any).uni;
      //uni.openLocation
      uni.postMessage({
        data: data,
      });
      uni.navigateBack({
        delta: 1
      });
    };
    const activeLandNoShake = () => {
      let timer: number = +new Date();
      return (
        landId: number,
        landList: Array<landItemType>,
        landLayer: LayerGroup,
        markers: Array<Marker>,
        markersLayer: LayerGroup,
        zoom = 14
      ) => {
        if (+new Date() - timer < 200) return;
        timer = +new Date();
        activeLand(landId, landList, landLayer, markers, markersLayer, zoom);
      };
    };
    const activeLand = (
      landId: number,
      landList: Array<landItemType>,
      landLayer: LayerGroup,
      markers: Array<Marker>,
      markersLayer: LayerGroup,
      zoom = 14
    ): void => {
      landList.map((land) => {
        if (Number(land.id) === Number(landId)) {
          land.select = !land.select;
        }
      });
      initSelectLandAndMarker(
        false,
        landList,
        landLayer,
        markers,
        markersLayer,
        zoom
      );
    };
    return {
      ...toRefs(selectLands),
      submit,
    };
  },
  components: {
    Button,
  },
});
</script>
<style lang="stylus">
.user-location{
  padding: 0 0 0.18rem 0;
  margin-bottom:0;
  .leaflet-popup-content{
    width: 26px;
    height: 34px;
    margin:0;
    display:flex;
    justify-content:center;
    align-items:center;
    img{
      width:0.4rem;
    }
  }
  .leaflet-popup-content-wrapper{
    background-color:#30cea8;
    padding: 0;
    border-radius:2px;
  }
  .leaflet-popup-tip{
     background-color:#30cea8;
  }
  .leaflet-popup-tip-container{
    width: 0.2rem;
    height: 0.2rem;
    margin: 0 0 0.18rem -0.1rem;
    bottom: -0.15rem;
  }
  .leaflet-popup-tip {
    width: 0.1rem;
    height: 0.1rem;
    margin: 0 auto 0;
  }
}
</style>
<style scoped lang="stylus">
.MapSelecter{
  width:100vw;
  height:100vh;
  background-color:#fff;
  #map{
    width: 100%;
    height: 100%;
    background:#000;
    >>> .leaflet-pane .leaflet-tile-pane{
      opacity:0.6;
    }
  }
  .customize-submit{
    width:327px;
    height:36px;
    line-height:36px;
    border-radius:2px;
    position:absolute;
    bottom:18px;left:50%;
    transform:translate(-50%,0);
    background-color:#22B07D;
    border-color:#22B07D;
    z-index:9999;
    &.noselect{
      background-color:#9FDECF;
      border-color:#9FDECF;
    }
  }
}
</style>
