<template>
    <v-container>
        <v-row class="cb-auth fill-height" justify="center" align="center">
            <v-col cols="11" md="6">
                <v-form v-on:submit.stop.prevent="onauth" action="#" v-model="data.valid">
                    <v-card class="elevation-5 pa-3"
                            color="amber-lighten-4">
                        <v-card-title>
                            <div class="form-icon">
                                <v-icon :color="has('user') ? 'white': 'primary'">
                                    {{has('user')?'mdi-account':'mdi-account-lock'}}
                                </v-icon>
                            </div>
                            <div class="form-title">
                                {{ settings.name }}
                                <div class="text-subtitle-1">{{ settings.description }}</div>
                                <div class="text-caption text-orange">пожалуйста авторизуйтесь</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-text-field
                                label="Логин"
                                name="login"
                                v-model="data.user.u"
                                autofocus
                                variant="underlined"
                                :rules="[rules.empty]"
                                required
                                autocapitalize="off"
                                autocomplete="username"
                                prepend-inner-icon="mdi-account"
                                color="primary">
                            </v-text-field>
                            <v-text-field
                                label="Пароль"
                                name="p"
                                type="password"
                                variant="underlined"
                                :rules="[rules.empty]"
                                v-model="data.user.p"
                                autocomplete="current-password"
                                prepend-inner-icon="mdi-asterisk"
                                color="primary">
                            </v-text-field>
                            <v-checkbox v-model="data.remmi" 
                                        label="запомнить"
                                        color="primary"
                                        density="compact"
                                        persistent-hint
                                        messages='не устанавливайте на "чужом" компьютере'>
                            </v-checkbox>
                            <v-alert color="warning" 
                                     dark 
                                     class="my-5" 
                                     icon="mdi-alert"
                                     v-if="has('error')">
                                <div v-html="data.error"></div>
                            </v-alert>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn type="submit" 
                                   :loading="data.pending"
                                   :color="has('user') ? 'info' : 'primary'"
                                   variant="flat">
                                <template v-if="has('user')">
                                    <v-icon>mdi-check-circle-outline</v-icon>&nbsp;ok
                                </template>
                                <template v-else>Войти</template>
                            </v-btn>
                        </v-card-actions>
                        <v-footer v-if="data.lastdt"
                                  color="transparent">
                            <v-spacer />
                            последний вход {{ data.lastdt }}
                        </v-footer>    
                    </v-card>
                </v-form>
            </v-col>
        </v-row>
    </v-container>
</template>
<script>
    const USER_DEFS = {
        id: null,
        title: '',  //user title
        u: '',
        p: ''
    };
    const rules = {
            empty: val => !empty(val) || "Необходимо заполнить"
    };
</script>
<script setup>
    import { empty } from "~/utils";
    import { reactive, computed } from "vue";
    import { useProfileStore } from "~/store/profile";
    import { useSettingsStore } from "~/store/settings";
    import $moment from "moment";
    const router = useRouter();
    console.log('router', router);

    definePageMeta({
        name: 'SignInPage',
        layout: 'empty'
    });

    const { data: settings } = await useAsyncData(useSettingsStore().read);
    
    const data = reactive({
        valid: false,
        user: {...USER_DEFS},
        remmi: false,
        error: null,
        lastdt: undefined,
        pending: false
    });
    
    if ( useRoute().query.logout ){
        useProfileStore().logout();
    } else {
        if ($nuxt.worker){
            const _on_jig = e => {
                if (
                        ("read" === e.data.type)
                     && (typeof e.data.lastjig !== "undefined")
                   ){
                    try {
                        let s = atob(e.data.lastjig);
                        eval(`s=${ s }`);
                        data.remmi = !!s;
                        data.user.u = s.u;
                        data.user.p = s.p;
                        data.lastdt = $moment(s.lastdt).format("DD.MM.YYYY HH:mm");

                        if (data.remmi){
                            onauth({tryit: true});
                        }
                    } catch(e){
                        console.log('ERR (decode)', e);
                    } finally {
                        $nuxt.worker.removeEventListener("message", _on_jig);
                    }
                }
            };
            $nuxt.worker.addEventListener("message", _on_jig);
            $nuxt.worker.postMessage({type:"read", name: "lastjig"});
        }
    }

    const has = q => {
            switch(q){
                case 'user':
                    return !empty(data.user.id); 
                case 'error':
                    return !empty(data.error); 
            }
            return false;
    };

    const onauth = async e => {
        data.error = null;
        const store = useProfileStore();
        try {
            let res = await store.auth(data.user);
            console.log('auth', res);
            if ($nuxt.worker){
                const s = (data.remmi) 
                            ? btoa(JSON.stringify({
                                    u: data.user.u,
                                    p: data.user.p,
                                    lastdt: new Date()
                              }))
                            : "";
                $nuxt.worker.postMessage({type: "save", name: "lastjig", data: s});
            }
            if ( (res.id) && (res.id > 0 ) ){
                router.replace({name: 'index'});
            }
        }catch(e){
            if (!e.tryit){
                data.error = e.message;
            }
            console.log('ERR (auth)', e);
        }
        return false;
    };
    
    

</script>

<style lang="scss">
    .cb-auth{
        min-height: calc(100vh - 56px);
        align-content: center;
        align-items: center;
        justify-content: center;
        & .v-card {
            &-title{
                text-transform: uppercase;
                font-weight: 300;
                font-size: 1.125rem;
                display: flex;
                word-break: break-word;
                line-height: 1.25;
                align-content: center;
                align-items: center;
                justify-content: center;
                padding-bottom: 3rem;
                & .v-icon{
                    line-height: 1 !important;
                    margin-right: 1rem;
                    border-radius: 500px;
                    padding: 0.25rem;
                    color: #999;
                    border: 1px solid orange;
                    width: 3rem;
                    text-align: center;
                    height: 3rem;
                }
            }
            &-text{
                & .v-field{
                    &__prepend-inner{
                        & .v-icon{
                            color: orange;
                            margin-right: 0.5rem;
                            font-size: 0.9rem;
                            align-self: center;
                        }
                    }
                }
            }
            & .v-card-actions{
                align-items: center;
                justify-content: center;
                & .v-btn{
                    width:12rem;
                    margin-bottom: 1rem;
                }
            }
        }
        & .v-footer{
            font-size: 0.75rem;
            color: rgba(var(--v-theme-primary)) !important;
        }
    }
</style>

