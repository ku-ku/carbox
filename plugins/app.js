import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { VDataTable } from 'vuetify/labs/VDataTable';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { useProfileStore } from "~/store/profile";
import { useSettingsStore } from "~/store/settings";

import { empty } from "~/utils";
import { cbMsgArgs as msgArgs } from "~/components/CbMsg";


import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';

import $ from "jquery";
window["$"] = $;

export default defineNuxtPlugin(nuxtApp => {
    
    window["$nuxt"] = nuxtApp;
    
    const config = useRuntimeConfig();
    
    nuxtApp.api = async opts => {
        const url = `${ config.public.api }${ opts.url }`;
        delete opts.url;
        return useFetch(url, opts);
    };  //api
    
    addRouteMiddleware('auth', to => {
        const { subject } = useProfileStore();
        if ( /(auth)+/.test(to.path) ) {
            return;
        } else if( (subject?.id||0) < 1 ) {
            return "/auth";
        }
    }, { global: true });

    const vuetify = createVuetify({
        components: {
                    ...components, 
                    VDataTable
        },
        directives,
        defaults: {
            VTextField: { variant: "underlined" },
            VCombobox: { variant: "underlined" },
            VAutocomplete: { variant: "underlined" },
            VTextarea: { variant: "underlined" },
            VDataTable: {
                fixedHeader: true,
                noDataText: 'Нет даных для отображения'
            }
        },
        options: { customProperties: true },
        theme: {
            defaultTheme: 'light',
            themes: {
                dark: {
                    colors: {
                        primary: "#febf00"
                    }                    
                },
                light: {
                    colors: {
                        primary: "#febf00"
                    }
                }
            }
        },
        icons: {
            defaultSet: 'mdi',
            aliases,
            sets: {
                mdi
            }      
        }
    });
    nuxtApp.vueApp.use(vuetify);
    
    useSettingsStore().read();
    
    nuxtApp.msg = msg => {
        var msg = Object.assign({
            color: "primary",
            timeout: 6000
        }, msg);
        msg.show = empty(msg.text) ? false : (new Date()).getTime();
        msgArgs.value = msg;
    };
    
    
    const worker = new Worker(`${ config.app.baseURL }ws.js`);
    worker.postMessage({type:"init", env: {...config.public}});
    worker.addEventListener("message", e => {
        console.log('message(worker)', e);
        const { type } = e.data;
        switch (type){
            case "lost":
                nuxtApp.msg.msg({ text: "Потеряна связь с сервером - попробуйте обновить страницу", color: "black" });
                break;
        }
    });
    
    nuxtApp.worker = worker;
});