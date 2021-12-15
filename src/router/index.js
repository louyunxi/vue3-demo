import { createRouter, createWebHashHistory } from 'vue-router';
const routes = [
    {
        path: '/',
        name: 'home',
        redirect: '/MapSelecter'
    },
    {
        path: '/mapSelecter',
        name: 'mapSelecter',
        component: () => import(/* webpackChunkName: "MapSelecter" */ '@/views/MapSelecter.vue')
    },
    {
        path: '/handwritingsign',
        name: 'handwritingsign',
        component: () => import(/* webpackChunkName: "Handwritingsign" */ '@/views/Handwritingsign.vue')
    },
    {
        path: '/about',
        name: 'About',
        component: () => import(/* webpackChunkName: "about" */ '@/views/About.vue')
    },
    {
        path: '/todoList',
        name: 'TodoList',
        component: () => import(/* webpackChunkName: "todo" */ '@/views/TodoList.vue')
    },
    {
        path: '/luckdraw',
        name: 'LuckDraw',
        component: () => import(/* webpackChunkName: "luckdraw" */ '@/views/LuckDraw.vue')
    },
    {
        path: '/address/list',
        name: 'Address',
        component: () => import(/* webpackChunkName: "address" */ '@/views/address/AddressList')
    },
    {
        path: '/address/edit',
        name: 'AddressEdit',
        component: () => import(/* webpackChunkName: "address" */ '@/views/address/AddressEdit')
    },
    {
        path: '/chat/list',
        name: 'Chat',
        component: () => import(/* webpackChunkName: "chatpage" */ '@/views/chat')
    }
];
const router = createRouter({
    history: createWebHashHistory(),
    routes
});
export default router;
//# sourceMappingURL=index.js.map