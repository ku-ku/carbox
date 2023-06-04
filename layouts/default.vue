<template>
    <v-app>
        <v-system-bar v-if="has('admin')"
                      color="red-accent-4">административный доступ&nbsp;
            <v-icon color="white">mdi-account-alert</v-icon>
        </v-system-bar>
        <v-app-bar color="primary"
                   dark
                   v-if="has('index')">
            <v-img src="/favicon.png" class="mx-3" 
                   max-width="56" 
                   style="border: 1px solid rgba(255,255,255,0.55);border-radius:6px;" />
            <v-form v-on:submit.stop.prevent="search"
                    action="#"
                    class="cb-search">
                <v-text-field label="поиск"
                              color="white"
                              hide-details
                              dense
                              clearable
                              v-model="s"
                              style="min-width:10rem;max-width:20rem;"
                              v-on:update:modelValue="search"
                              v-on:click:clear="$nextTick(search)"
                              light>
                </v-text-field>
                <v-btn size="small"
                       type="submit"
                       icon>
                    <v-icon color="white">
                        mdi-magnify
                    </v-icon>
                </v-btn>
            </v-form>
            <div class="cb-all-payments d-none d-sm-block">
                <v-badge :content="totals.paids"
                         offset-x="-15"
                         offset-y="-5"
                         color="white">
                    <div>
                        {{ period }}:&nbsp;всего - {{ totals.num }}
                        <div class="text-muted">(путевок/оплат)</div>
                    </div>    
                </v-badge>
            </div>
            <v-spacer />
            <v-btn icon
                   color="white"
                   v-on:click="reload">
                <v-icon>mdi-reload</v-icon>
            </v-btn>
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn icon
                           color="white"
                           v-bind="props">
                        <v-icon>mdi-sort-variant</v-icon>
                    </v-btn>
                </template>
                <v-list nav
                        density="compact"
                        color="primary"
                        class="cb-sorting">
                    <v-list-subheader>сортировка записей</v-list-subheader>
                    <v-list-item v-on:click="sort=SORT_MODES.modified"
                                 value="SORT_MODES.modified"
                                 title="По дате изменений">
                        <template v-slot:prepend 
                                  v-if="sort.mode===SORT_MODES.modified">
                            <v-icon size="small">{{ sort.asc ? "mdi-arrow-down-thin" : "mdi-arrow-up-thin"}}</v-icon>
                        </template>
                    </v-list-item>
                    <v-list-item v-on:click="sort=SORT_MODES.permit"
                                 value="SORT_MODES.permit"
                                 title="По номеру разрешения">
                        <template v-slot:prepend 
                                  v-if="sort.mode===SORT_MODES.permit">
                            <v-icon size="small">{{ sort.asc ? "mdi-arrow-down-thin" : "mdi-arrow-up-thin"}}</v-icon>
                        </template>
                    </v-list-item>
                    <v-list-item v-on:click="sort=SORT_MODES.govnum"
                                 value="SORT_MODES.govnum"
                                 title="По госзнаку ТС">
                        <template v-slot:prepend 
                                  v-if="sort.mode===SORT_MODES.govnum">
                            <v-icon size="small">{{ sort.asc ? "mdi-arrow-down-thin" : "mdi-arrow-up-thin"}}</v-icon>
                        </template>
                    </v-list-item>
                    <v-divider />
                    <v-list-subheader>графики</v-list-subheader>
                    <v-list-item v-on:click="showInfo(0)"
                                 title="Информация по источникам...">
                        <template v-slot:prepend>
                            <v-icon size="small">mdi-chart-bar</v-icon>
                        </template>
                    </v-list-item>
                    <v-list-item v-on:click="showInfo(1)"
                                 title="Путевки по менеджерам...">
                        <template v-slot:prepend>
                            <v-icon size="small">mdi-chart-donut-variant</v-icon>
                        </template>
                    </v-list-item>
                    <v-list-item v-on:click="showInfo(2)"
                                 title="Оплаты по месяцам...">
                        <template v-slot:prepend>
                            <v-icon size="small">mdi-cash-100</v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-menu>    
            <v-btn icon
                   color="white"
                   v-on:click="report">
                <v-icon>mdi-file-table-outline</v-icon>
            </v-btn>
        </v-app-bar>
        <NuxtLoadingIndicator />
        <v-main>
            <v-container>
                <nuxt-page />
            </v-container>
            <cb-msg />
        </v-main>
        <v-footer app
                  color="grey-lighten-5">
            {{ records }}
            <v-spacer />
            <v-btn size="x-small"
                   flat
                   v-on:click="$refs['period'].open()">
                <span v-bind:class="{outofperiod: outofperiod}">{{ period }}</span>
            </v-btn>    
            <v-btn size="x-small"
                   :href="get('help-link')"
                   target="_blank"
                   flat>
                <v-icon size="small">mdi-information</v-icon>
            </v-btn>    
            <v-tooltip text="выйти">
                <template v-slot:activator="{ props }">
                    <v-btn size="x-small"
                           v-bind="props"
                           v-on:click="logout"
                           flat>
                        <v-icon size="small">mdi-logout</v-icon>
                    </v-btn>
                </template>    
            </v-tooltip>    
        </v-footer>
        <cb-period ref="period" 
                   v-on:change="reload" />
        <cb-sources-chart ref="sources" />
    </v-app>
</template>
<script>
    import { ref, reactive } from "vue";
    import { report } from "~/utils/excel";
    import { MONTH_NAMES as MONTHS, SORT_MODES } from "~/utils";
    import { useSettingsStore } from "~/store/settings";
    import { useDataStore } from "~/store/data";
    import $moment from "moment";
    $moment.locale("ru");
    
    export const tbEvents = reactive({
        reload: false,
        search: null,
        searched: 0,
        sorting: {
            mode: SORT_MODES.modified,
            asc:  false /* "true" - ASC, "false" - DESC */
        }
    });
    
    let hTm = false;
    
    export default {
        async setup(){
            definePageMeta({
                keepalive: {
                    exclude: ['taxi-id']
                }
            });
            
        },
        data(){
            return {
                SORT_MODES,
                s: null
            };
        },
        computed: {
            period(){
                const { period } = useSettingsStore().settings.local;
                let n = MONTHS.findIndex( m => m.id === period.month );
                return `${ n < 0 ? 'янв' : MONTHS[n].name}, ${period.year}`;
            },
            outofperiod(){
                const { period } = useSettingsStore().settings.local,
                      now = new Date();
                return (now.getFullYear()*100 + now.getMonth()) != (period.year * 100 + period.month);
            },
            records(){
                const n = useDataStore().count,
                      s = tbEvents.searched > 0 ? ` /${tbEvents.searched}` : '';
                const at = useSettingsStore().settings.at || 'Invalid';
                console.log('$moment', $moment);
                return `${ n || '...'} ${ s } записей (${ $moment(at).isValid() ? $moment(at).format("DD.MM.YYYY HH:mm") : '-'})`;
            },
            totals(){
                return useDataStore().payments;
            },
            sort: {
                get(){
                    return tbEvents.sorting;
                },
                set(val){
                    let sort = {
                        mode: val,
                        asc: (tbEvents.sorting.mode === val)
                                ? !tbEvents.sorting.asc
                                : true
                    };
                    tbEvents.sorting = sort;
                }
            }
        },
        methods: {
            report,
            get(q){
                switch(q){
                    case 'help-link':
                        return `${useRuntimeConfig().app.baseURL}help.pdf`;

                }
                return false;
            },
            reload(){
                tbEvents.search = null;
                tbEvents.reload = (new Date()).getTime();
            },
            search(e){
                if ( hTm ){
                    clearTimeout(hTm);
                }
                hTm = setTimeout(()=>{
                    hTm = false;
                    if (
                            (!this.s)
                          ||(this.s.length < 1)
                       ) {
                        tbEvents.search = null;
                    } else if (this.s.length > 1){
                        tbEvents.search = this.s;
                    }
                }, 666);
            },
            showInfo(that){
                this.$refs["sources"].open(that);
            },
            logout(){
                useRouter().replace({name:'SignInPage', query:{logout:(new Date()).getTime()}});
            }
        }
    };
</script>    
<script setup>
    import { useProfileStore } from "~/store/profile";
    
    const route = useRoute();

    const has = q => {
        switch(q){
            case 'admin':
                return !!(useProfileStore().subject?.admin);
            case 'index':
                return 'index'===route.name;
        }
        return false;
    };
    
</script>
<style lang="scss">
    .v-footer{
        font-size: 0.75rem;
        border-top: 1px solid #f5f5f5;
        & .outofperiod{
            color: #d50000;
        }
    }
    .cb-search{
        min-width:20rem;
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        margin: 0 1rem;
        flex-wrap: nowrap;
        justify-content: flex-start;
        & .v-field{
            & .v-field__clearable, 
            & input, & .v-label {
                color: #fff !important;
            }
            &__outline::before{
                border-color: white;
                opacity: 0.8;
            }
        }
    }
    .cb-sorting{
        & .v-list{
            &-item{
                &__prepend{
                    & > .v-icon{
                        margin-inline-end: 4px;
                    }
                }
            }
        }
    }
    .cb-all-payments{
        color: #fff;
        font-size: 1rem;
        & .text-muted{
            font-size: 0.75rem;
            opacity: 0.9;
        }
        & .v-badge{
            &__badge{
                opacity: 0.75;
                box-shadow: 0 2px 4px rgba(0,0,0,0.18);
            }
        }
    }
@media screen and (max-width: 600px){
    .v-app-bar{
        & .v-btn {
            &.v-btn--icon.v-btn--size-default{
                width: var(--v-btn-height);
                height: var(--v-btn-height);
            }
            & .v-icon{
                font-size: 0.9rem;
            }
        }
    }
    .cb-search{
        min-width:auto;
    }
}    
</style>