const isDev = (process.env.NODE_ENV === 'development');
const _HOST = "http://e-elvistaxi.ru";

export default defineNuxtConfig({
    ssr: false,
    app: {
        head: {
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no' },
                { hid: 'description', name: 'description', content: 'Водитель такси, грузовое такси, курьер, яндекс еда' },
                { name: 'format-detection', content: 'telephone=no' }
            ],
            link: [
                    { rel: 'icon', type: 'image/png', href: '/favicon.png' }
            ],
            script: [
            ]
        },
        baseURL: isDev ? '/' : '/wp-content/themes/taxi/app/',
        keepalive: true
    },
    css: ['vuetify/lib/styles/main.sass'],
    modules: [
        '@pinia/nuxt',
    ],
    router: {
        options: {
            /* hashMode: true*/
        }
    },
    build: {
        transpile: ['vuetify']
    },
    runtimeConfig: {
        public: {
            api: isDev ? '/wp-json' : `${ _HOST }/wp-json`
        }
    },
    nitro: {
        devProxy: {
            '/wp-json': {
                target: 'http://e-elvistaxi.ru/wp-json',
                changeOrigin: true
            }
        }
    },
    server: {
        host: '0'
    },
    typescript: {
        shim: false
    }
});