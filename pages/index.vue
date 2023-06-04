<template>
    <v-sheet class="cb-index">
        <v-list v-if="has('vehicles')"
                density="compact"
                :selected="selected">
            <v-list-item v-for="v in vehicles"
                         :key="'vc-' + v.id"
                         :class="itemClass(v)"
                         :value="v.id"
                         color="green"
                         select-strategy="classic"
                         v-on:click="edit(v)">
                <template v-slot:prepend>
                    <div class="cb-vehicle__perm">
                        <div class="num" v-if="empty(v.permNum)">
                            <v-badge dot color="blue-grey-lighten-4"></v-badge>    
                        </div>    
                        <div class="num" v-else>
                            <v-badge dot floating
                                     :color="('on'===v.status) ? 'green-lighten-2' : 'grey-lighten-2'">
                                {{ v.permNum }}
                            </v-badge>
                        </div>
                        <div class="dt">{{ fmt(v.permDt) }}</div>
                    </div>
                </template>    
                <v-row>
                    <v-col class="cb-vehicle__inf">
                        <div class="gov">
                            <span class="gov__gov">{{ v.gov }}</span>
                            <span class="model text-truncate">{{v.model}}</span></div>
                        <div class="meta">
                            <div class="modified d-none d-sm-inline-block">{{ fmt(v.modified, true) }}</div>
                            <div class="town">
                                <template v-if="!empty(v.town)">
                                    <v-icon size="x-small">mdi-map-marker-outline</v-icon>
                                    {{ v.town }}
                                </template>
                                <template v-else>
                                    <v-icon size="x-small" color="red">mdi-map-marker-alert-outline</v-icon>
                                </template>
                            </div>
                            <div class="manager"><v-icon size="x-small">mdi-account-tie</v-icon>{{ v.manaName }}</div>
                            <div v-if="searched&&(!!v.searched)" class="searched">
                                <v-icon size="x-small">mdi-magnify</v-icon>
                                {{ v.searched }}
                            </div>
                        </div>
                    </v-col>
                    <v-col class="cb-vehicle__ticks">
                        <template v-if="!!v.lastTick">
                            <v-tooltip v-if="!!v.lastTick.note"
                                       :text="v.lastTick.note">
                                <template v-slot:activator="{ props }">
                                    <v-icon v-bind="props">mdi-information-outline</v-icon>&nbsp;
                                </template>    
                            </v-tooltip>
                            <b>{{ v.lastTick.num }}</b>&nbsp;/&nbsp;
                            <v-chip v-if="v.lastTick.paid" 
                                    color="success"
                                    pill
                                    prepend-icon="mdi-check-circle-outline"
                                    density="compact">
                                {{ v.lastTick.pay }}
                            </v-chip>
                            <template v-else>
                                {{ v.lastTick.pay }}
                            </template>
                            <div class="dt">
                                {{ v.lastTick.dt.format('DD.MM.YYYY') }}
                            </div>
                        </template>
                        <template v-else>
                            -
                        </template>
                    </v-col>
                </v-row>
                <template v-slot:append>
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn flat
                                   size="small"
                                   v-bind="props"
                                   v-on:click.stop.prevent="stub(v)">
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </template>
                        <v-list nav
                                density="compact">
                            <v-list-item 
                                prepend-icon="mdi-text-box-edit-outline"
                                v-on:click="tickets(v)">
                                Дополнительно...
                                <div class="text-muted">
                                    ввод информации о путевках/оплатах на дату
                                </div>
                            </v-list-item>
                            <v-divider></v-divider>
                            <v-list-item 
                                prepend-icon="mdi-close"
                                v-on:click="remove(v)">Удалить
                                <div class="text-muted">
                                    осторожно!
                                </div>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-list-item>
        </v-list>
        <v-expand-transition>
            <v-alert v-show="has('bad-search')"
                     type="warning">
                Поиск "{{ s }}" не дал результатов.<br />
                Измените строку поиска и попробуйте еще раз.
            </v-alert>
        </v-expand-transition>    
        <v-btn color="primary"
               icon
               fab
               position="fixed"
               :loading="pending"
               :to="{path:'/taxi/-1'}">
            <v-icon color="white">mdi-plus</v-icon>
        </v-btn>
        <template v-if="(has('all') && (all.length > PAGE_SIZE) && !has('search') )">
            <v-pagination v-model="page" 
                          :length="((all.length / PAGE_SIZE) | 0) + 1"
                          total-visible="8"
                          active-color="primary"
                          density="compact"
                          v-on:update:modelValue="onpage">
            </v-pagination>
        </template>
    </v-sheet>
    <cb-trip-ticket ref="ticket" 
                    v-on:onchange="savetickets"/>
</template>
<script>
import { useDataStore } from "~/store/data";
import { useSettingsStore } from "~/store/settings";
import { computed, ref, unref, reactive } from "vue";
import { tbEvents } from "~/layouts/default";
import { empty, SORT_MODES } from "~/utils";
import { report} from "~/utils/excel";
import $moment from "moment";
$moment.locale("ru");

const PAGE_SIZE = 20;

export default {
    async setup(){
        definePageMeta({
            key: 'cb-vehicles',
            keepalive: true
        });
        useHead({
            title: useSettingsStore().settings.name + ' | Список ТС'
        });
        
        const ds = useDataStore();
        await useAsyncData('managers', ()=>ds.references('manager') );
        let { pending } = useAsyncData('vehicles-all', ()=>ds.read(undefined, 'all'));
        return {
            pending
        };
    },
    data(){
        return {
            PAGE_SIZE,
            page: 1,
            s: null
        };
    },
    computed: {
        events(){
            return tbEvents;
        },
        sorting(){
            return tbEvents.sorting;
        },
        searched(){
            return !empty(this.s);
        },
        all(){
            return useDataStore().vehiclesAll;
        },
        vehicles(){
            const sortfun = (this.sorting.mode === SORT_MODES.permit)
                                    ? (v1, v2) => {
                                        let n1 = Number(v1.permNum||0),
                                            n2 = Number(v2.permNum||0);
                                        return this.sorting.asc 
                                                ? n1 < n2 ? -1 : n1==n2 ? 0 : 1
                                                : n2 < n1 ? -1 : n2==n1 ? 0 : 1;
                                    }
                                    : (this.sorting.mode === SORT_MODES.govnum)
                                    ? (v1, v2) => {
                                        return this.sorting.asc 
                                                ? v1.gov.localeCompare(v2.gov)
                                                : v2.gov.localeCompare(v1.gov);
                                    }
                                    : (v1, v2) => {
                                        let d1 = $moment(v1.date),
                                            d2 = $moment(v2.date);
                                        return this.sorting.asc 
                                                ? d1.isBefore(d2) ? -1 : 1
                                                : d2.isBefore(d1) ? -1 : 1
                                                
                                    }
            if ( empty(this.s) ){
                return (this.all||[]).sort(sortfun).slice((this.page - 1) * PAGE_SIZE, this.page * PAGE_SIZE);
            } else {
                const re = new RegExp(`(${ this.s })+`, 'i');
                return this.all.map( a => {
                    a.searched = re.test(a.gov) 
                                    ? a.gov
                                    : (this.s==a.permNum)
                                    ? a.permNum
                                    : re.test(a.ownName) 
                                    ? a.ownName
                                    : re.test(a.drivName) 
                                    ? a.drivName
                                    : false;
                    return a;
                }).filter( a => !!a.searched );
            }
        },
        selected: {
            get(){
                const ds = useDataStore();
                return (ds.vehicle) ? [ds.vehicle.id] : [];
            },
            set(v){
                const ds = useDataStore();
                if ( (v)&&(v.length > 0) ){
                    let n = this.all.findIndex( a => a.id === v[0] );
                    ds.vehicle = ( n > -1 ) ? this.all[n] : null;
                } else {
                    ds.vehicle = null;
                }
            }
        }
    },
    methods: {
        empty,
        has(q){
            switch(q){
                case 'all':
                    return this.all?.length > 0;
                case 'bad-search':
                    return !empty(this.s) && this.vehicles?.length < 1;
                case 'search':
                    return !empty(this.s);
                case 'vehicles':
                    return this.all?.length > 0;
            }
            return false;
        },  //has
        onpage(e){
            this.$nextTick( ()=> { $("html, body").animate({ scrollTop: 0 }, "fast");} );
        },
        fmt(dt, withtime = false){
            let _dt = $moment(dt);
            return ( _dt.isValid() ) ? _dt.format(withtime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY') : dt;
        },
        itemClass( vc ){
            let _class = {"cb-vehicle": true};
            if (!vc.lastTick?.paid){
                _class["nopay"] = true;
            }
            if ( 
                    ("na"===vc.status)
                 || empty(vc.permNum)
                ){
                _class["not-complete"] = true;
            }
            return _class;
        },
        stub({ id }){
            this.selected = [id];
            return false;
        },
        tickets(vc){
            this.$refs["ticket"].open(vc);
        },
        savetickets(vc){
            console.log(vc);
        },
        edit({ id }){
            this.selected = [id];
            useRouter().push({name: 'taxi-id', params: { id }});
        },
        remove(vehicle) {
            var vehicle = unref(vehicle);
            if ( !confirm(`Подтвердите удаление записи для "${ vehicle.gov }"`) ){
                return false;
            }
            const ds = useDataStore();
            ds.remove(vehicle.id).then( ({data, error}) => {
                console.log('remove data', data);
                if (error){
                    throw error;
                }
                $nuxt.msg({text: 'Запись удалена'});
            }).catch( e=>{
                console.log('ERR remove', e);
                $nuxt.msg({text: 'Ошибка при удалении записи - попробуйте еще раз', color: "warning"});
            });
        }  //remove
    },
    watch: {
        "events.reload"(val){
            if (val){
                this.pending = true;
                try {
                    useDataStore().vehicles = [];
                    this.page = 1;
                    refreshNuxtData('vehicles-all');
                } finally{
                    this.pending = false;
                } 
            }
        },
        "events.search"(val){
            this.s = val;
            this.$nextTick(()=>{
                tbEvents.searched = this.vehicles.length;
            })
        }
    }
};
</script>
<style lang="scss" scoped>
    .cb-index{
        & .v-btn{
            &--fixed{
                right: 1rem;
                bottom: 3.5rem;
            }
        }
        & .v-list{
            &-item {
                border-bottom: 1px solid #efefef;
                align-content: center;
                align-items: center;
                line-height: 1.115;
                & .v-row{
                    flex-wrap: nowrap;
                }
            }
        }
        & .v-menu{
            font-size: 0.85rem;
            & .v-list{
                font-size: 0.85rem;
            }
        }
        & .cb-vehicle{
            &__perm {
                width: 8rem;
                max-width: 8rem;
                text-align: center;
                & .num {
                    padding-top: 6px;
                    font-size: 1.25rem;
                }
                & .dt{
                    font-size: 0.85rem;
                }
            }
            &__inf{
                & .gov{
                    & .gov__gov{
                        display: inline-block;
                        font-size: 1.125rem;
                        width: 8rem;
                        margin-right: 1rem;
                    }
                    
                    & .model{
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        color: #777;
                    }
                }
                & .meta{
                    font-size: 0.85rem;
                    display: flex;
                    flex-wrap: no-wrap;
                    align-items: center;
                    & > * {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    & > *:not(:last-child) {
                        margin-right: 1rem;
                        width: 8rem;
                    }
                    & .v-icon{
                        color: #777;
                        margin-right: 0.125rem;
                    }
                    & .searched{
                        color: #0D47A1;
                    }
                } /* .meta */
            }
            &__ticks{
                max-width: 12rem;
                text-align: center;
                align-self: center;
                font-size: 0.75rem;
                & .v-chip{
                    font-size: 0.75rem;
                }
                & .dt{
                    margin-top: 0.25rem;
                }
            }
        }   /* .cb-vehicle */
        & .cb-vehicle:not(.v-list-item--active){
            &.nopay{
                background-color: #fff8e1;
                border-bottom: 1px solid #fffcb3;
                & .v-btn {
                    background-color: #fff8e1;
                }
            }
            &.not-complete{
                background-color: #eceff1; /*blue-grey-lighten-5*/
                border-bottom: 1px solid #cfd8dc;/*blue-grey-lighten-4*/
                & .v-btn {
                    background-color: #eceff1;  
                }
            }
        }
    }
    .text-muted{
        font-size: 0.7rem;
    }
    
    
@media screen and (max-width: 600px){
    .cb-index{
        & .cb-vehicle{
            &__perm {
                align-self: start;
                width: 6rem;
                max-width: 6rem;
                text-align: center;
                & .num {
                    padding-top: 6px;
                    font-size: 1rem;
                    font-weight: 500;
                }
                & .dt{
                    font-size: 0.75rem;
                }
            }
            &__inf{
                & .meta{
                    font-size: 0.75rem;
                    & > *:not(:last-child) {
                        margin-right: 0.5rem;
                        width: auto;
                    }
                }
            }
        }
    }
}
</style>