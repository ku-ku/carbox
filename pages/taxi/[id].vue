<template>
    <v-form class="cb-taxi"
            ref="form"
            fast-fail
            v-on:submit.stop.prevent="save">
        <v-card :loading="pending">
            <v-toolbar :color="has('perm-valid') ? 'primary' : 'blue-grey'">
                <v-toolbar-title style="color:white">
                    <v-btn icon
                           v-on:click="back">
                        <v-icon>mdi-chevron-left</v-icon>
                    </v-btn>
                    <v-icon size="x-small">{{ has('new') ? 'mdi-plus' : 'mdi-square-edit-outline'}}</v-icon>&nbsp;
                    {{ has('new') ? 'Новая запись' : 'Редактирование #' + vehicle.id  }}
                </v-toolbar-title>
            </v-toolbar>
            <v-card-text class="mt-5">
                <v-row>
                    <v-col cols="12" sm="3">
                        <v-text-field label="Дата, время оформления"
                                      v-model="vehicle.date"
                                      style="max-width:12rem;"
                                      :messages="['эта дата обновится при записи']"
                                      readonly>
                        </v-text-field>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-combobox label="Район/МО"
                                    item-title="name"
                                    item-value="name"
                                    no-data-text="нет данных"
                                    autocomplete="off"
                                    :return-object="false"
                                    :items="towns.items"
                                    :rules="[ rules.empty ]" 
                                    v-model="vehicle.town">
                        </v-combobox>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-autocomplete label="Менеджер"
                                    item-title="name"
                                    item-value="id"
                                    no-data-text="нет данных"
                                    autocomplete="off"
                                    :return-object="false"
                                    :items="managers.items"
                                    :rules="[ rules.empty ]" 
                                    v-model="vehicle.manager">
                        </v-autocomplete>
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-combobox label="источник информации"
                                    item-title="name"
                                    item-value="name"
                                    no-data-text="нет данных"
                                    autocomplete="off"
                                    :return-object="false"
                                    :items="informants.items"
                                    v-model="vehicle.informant">
                        </v-combobox>
                    </v-col>    
                </v-row>
                <v-row>
                    <v-col cols="12" class="text-subtitle-1 pb-0"><v-icon>mdi-car-sports</v-icon>&nbsp;Информация о ТС</v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field label="Госзнак"
                                      v-model="vehicle.gov"
                                      v-on:change="ongov"
                                      hide-details
                                      :rules="[ rules.empty ]">
                            <template v-slot:append>
                                <v-tooltip>
                                    <template v-slot:activator="{ props }">
                                        <v-btn size="small"
                                               variant="tonal"
                                               color="primary"
                                               v-bind="props"
                                               :loading="extloading"
                                               v-on:click="getexternal">
                                            <v-icon>mdi-car-info</v-icon>
                                        </v-btn>
                                    </template>
                                    запросить информацию...
                                </v-tooltip>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-combobox label="Марка/Модель"
                                    item-title="name"
                                    item-value="name"
                                    hide-details
                                    autocomplete="off"
                                    no-data-text="нет данных"
                                    :return-object="false"
                                    :items="models.items"
                                    :rules="[ rules.empty ]" 
                                    v-model="vehicle.model">
                        </v-combobox>
                    </v-col>
                    <!--v-col cols="12" sm="4">
                        <v-text-field label="Год выпуска"
                                      v-model="vehicle.year"
                                      style="max-width:6rem;"
                                      hide-details>
                        </v-text-field>
                    </v-col-->
                </v-row>
                <v-row>
                    <v-col cols="12" sm="4">
                        <cb-date-input label="Дата разрешения"
                                       type="date"
                                       :rules="[ rules.empty ]" 
                                       :value="vehicle.permDt"
                                       v-on:ondate="vehicle.permDt = $event">
                        </cb-date-input>
                    </v-col>    
                    <v-col cols="12" sm="4">
                        <v-text-field label="Номер разрешения"
                                      v-model="vehicle.permNum"
                                      hide-details
                                      :rules="[ rules.empty, rules.isint ]">
                        </v-text-field>
                    </v-col>    
                    <v-col cols="12" sm="4">
                        <v-autocomplete label="Статус"
                                    item-title="name"
                                    item-value="id"
                                    hide-details
                                    :return-object="false"
                                    :items="[{id:'na', name:'На оформлении'},{id:'on', name:'Действующий'},{id: 'off', name:'Недействующий'}]"
                                    :rules="[ rules.empty ]" 
                                    v-model="vehicle.status">
                        </v-autocomplete>
                    </v-col>    
                </v-row>
                <v-row>
                    <v-col cols="12" class="text-subtitle-1 pb-0"><v-icon>mdi-account-tie</v-icon>&nbsp;Собственник</v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field label="ФИО"
                                      :rules="[ rules.empty ]" 
                                      v-model="vehicle.ownName">
                        </v-text-field>
                    </v-col>    
                    <v-col cols="12" sm="4">
                        <v-text-field label="Тел.собственника"
                                      v-model="vehicle.ownTel"
                                      messages="+79187891234"
                                      :rules="[ rules.empty ]"
                                      type="tel">
                        </v-text-field>
                    </v-col>    
                </v-row>
                <v-row>
                    <v-col cols="12" class="text-subtitle-1 pb-0"><v-icon>mdi-account-tie-hat</v-icon>&nbsp;Водитель</v-col>
                    <v-col cols="12" sm="4">
                        <v-text-field label="ФИО"
                                      :rules="[ rules.empty ]" 
                                      v-model="vehicle.drivName">
                        </v-text-field>
                    </v-col>    
                    <v-col cols="12" sm="4">
                        <v-text-field label="Тел.водителя"
                                      :rules="[ rules.empty ]" 
                                      messages="+79091234567"
                                      v-model="vehicle.drivTel"
                                      type="tel">
                        </v-text-field>
                    </v-col>
                    <!--v-col cols="12" sm="4">
                        <v-text-field label="№ договора"
                                      :rules="[ rules.empty ]" 
                                      v-model="vehicle.contraNum">
                        </v-text-field>
                    </v-col-->
                </v-row>
                <v-row>
                    <v-col cols="12" class="text-subtitle-1 pb-0"><v-icon>mdi-car-settings</v-icon>&nbsp;Прочее</v-col>
                    <v-col cols="12" sm="4" class="d-flex">
                        <v-text-field label="Путевки"
                                      v-model="lasticket.num"
                                      :messages="'изм.: ' + lasticket.dt"
                                      v-on:update:focused="onsheets"
                                      readonly>
                        </v-text-field>
                        <v-tooltip text="Информация по датам">
                            <template v-slot:activator="{ props }">
                                <v-btn flat
                                       v-bind="props"
                                       v-on:click="onsheets">
                                    <v-icon>mdi-dots-horizontal</v-icon>
                                </v-btn>
                            </template>    
                        </v-tooltip>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <cb-date-input label="Дата техосмотра"
                                       type="date"
                                       :rules="[ rules.empty ]" 
                                       :value="vehicle.techDt"
                                       v-on:ondate="vehicle.techDt = $event">
                        </cb-date-input>
                    </v-col>
                    <v-col cols="12" sm="4">
                        <v-autocomplete label="ОСАГО"
                                    item-title="name"
                                    item-value="name"
                                    autocomplete="off"
                                    :return-object="false"
                                    :items="osago"
                                    v-model="vehicle.osago">
                        </v-autocomplete>
                    </v-col>
                </v-row>    
                <v-row>    
                    <v-col cols="12">
                        <v-textarea label="Особые отметки"
                                    rows="1"
                                    clearable
                                    single-line
                                    v-model="vehicle.notes"></v-textarea>
                    </v-col>
                </v-row>    
            </v-card-text>
            <v-card-text v-if="has('error')">
                <v-alert type="warning"
                         border="left"
                         colored-border>
                    Ошибка получения данных<br />
                    Информация для технической поддержки:
                    <div class="text-muted">
                        {{ errm }}
                    </div>
                </v-alert>
            </v-card-text>
            <v-card-actions class="pa-5">
                <v-btn type="button"
                       variant="elevated"
                       color="primary"
                       v-on:click="back">
                    <v-icon small>mdi-chevron-left</v-icon>
                </v-btn>
                <v-spacer />
                <v-btn v-if="has('delete')"
                       type="button"
                       size="small"
                       prepend-icon="mdi-close"
                       v-on:click="remove">
                    удалить запись
                </v-btn>
                <v-btn type="submit"
                       color="primary"
                       variant="elevated"
                       :loading="pending">
                    записать&nbsp;<v-icon>mdi-send</v-icon>
                </v-btn>
            </v-card-actions>
        </v-card>
        <cb-trip-tickets ref="tripTickets" 
                         v-on:change="onticks" />
    </v-form>
</template>
<script>
    import { ref, unref, reactive, computed } from 'vue';
    import { useDataStore } from "~/store/data";
    import { useProfileStore } from "~/store/profile";
    import Inputmask from "inputmask";
    
    import $moment from "moment";
    $moment.locale('ru');
    import { empty } from "~/utils";
    
    
    import CbTripTickets from "~/components/CbTripTickets";
    import CbTelInput from "~/components/CbTelInput";
    
    const rules = {
            empty: val => !empty(val) || "Необходимо заполнить",
            isint: val => Number.isInteger(Number.parseInt(val)) || 'Введите числовое значение'
    };
    
    const _PH_MASK = "+7(999)999-99-99";
    
    const _TX_DEFS = {
        id: -1,
        date:  null,
        town:  null,
        model: null,
        gov:   null,
        year:  1900,
        permDt: null,
        permNum: null,
        ownName: null,
        ownTel: null,
        contraNum: null,
        drivName: null,
        drivTel: null,
        manager: null,
        status: 'on',
        techDt: null,
        ticks: [],
        notes: null,
        informant: null
    };
    
    
export default {
    name: 'TaxiForm',
    components: {
        CbTripTickets,
        CbTelInput
    },
    async setup(){
        
        const route = useRoute();
        const { id } = route.params;
    
        let error = ref(null),
        pending = ref(true);
        
        const form = ref(null);     //TODO: using...
        const ds    = useDataStore();
    
        const { data: towns }     = await useAsyncData( ()=>ds.references('town') );
        const { data: models }    = await useAsyncData( ()=>ds.references('model') );
        const { data: managers }  = await useAsyncData( ()=>ds.references('manager') );
        const { data: informants }= await useAsyncData( ()=>ds.references('informant') );
        const osago = ds.osago;

        const { data: vehicle } = await useAsyncData(async ()=>{
            let vc;
            if (id < 1){
                vc = { ..._TX_DEFS };
                vc.date = $moment().format("DD.MM.YYYY HH:mm");
                return vc;
            }
            vc = await ds.read(id);
            
            if (typeof vc.ticks === "undefined"){
                vc.ticks = [];
            } else {
                vc.ticks = vc.ticks.map( t=>ref(t) );
            };
            return vc;
        });
        console.log('vehicle', vehicle);

        const lasticket = computed( ()=>{
            let res = {
                num: null,
                dt:  '-'
            },
            
            ticks = vehicle.value?.ticks || [];
            if ( ticks.length > 0) {
                const lt = ticks.sort( (t1, t2) => {
                    return $moment(t1.value.dt).isBefore( t2.value.dt ) ? 1 : -1;
                }).at(0);
                
                res.num = lt.value.num;
                res.dt = $moment(lt.value.dt).format('DD.MM.YYYY');
            }
            return res;
        }); //lasticket

        const has = q => {
            switch(q){
                case 'admin':
                    return !!(useProfileStore().subject?.admin);
                case 'delete':
                    return !has('new')&&has('admin');
                case 'error':
                    return !!error.value;
                case 'new':
                    return (vehicle?.value.id || -1) < 1;
                case 'perm-valid':
                    return ("on"===vehicle?.value.status);
            }
            return false;
        };  //has
        
        let _esc;
        
        const back = () => {
            document.removeEventListener('keydown', _esc);
            useRouter().replace({name: 'index', query:{id: vehicle.value?.id}});
        }
        
        _esc = e => {
            if(e.keyCode == 27){
                back();
            }
        };  //
        document.addEventListener('keydown', _esc);

        const save = async e => {
            pending = true;
            useAsyncData( ()=>ds.save(vehicle) ).then( ({data, error: err, pending: saving}) => {
                console.log('save data', data);
                error   = err;
                pending = saving;
                setTimeout(()=>{
                    pending = false;
                    useRouter().replace({name: 'index', query:{id: data.id}});
                }, 500);
            }).catch( e => {
                console.log('ERR save', e);
                pending = false;
                error = e;
            });
        };   //save
        
        const remove = async e => {
            if ( !confirm(`Подтвердите удаление записи для "${ vehicle.value.gov }"`) ){
                return false;
            }

            pending = true;
            useAsyncData( ()=>ds.remove(vehicle.value.id) ).then( ({data, error: err}) => {
                console.log('remove data', data);
                error   = err;
                if (err){
                    throw err;
                }
                $nuxt.msg({text: 'Запись удалена'});
                setTimeout(()=>{
                    pending = false;
                    back();
                }, 500);
                error   = err;
            }).catch( e=>{
                console.log('ERR remove', e);
                pending = false;
                error = e;
                $nuxt.msg({text: 'Ошибка при удалении записи - попробуйте еще раз', color: "warning"});
            });
        };  //remove
                
        pending = false;
        
        definePageMeta({
            keepalive: false,
            pageTransition: false,
        });
        useHead({
            title: has('new') ? 'Новая запись' : `Редактирование #${ vehicle.id }`
        });
        
        const onticks = ticks => {
            vehicle.value.ticks = ticks;
        }
                
        
        return {
            rules,
            pending,
            towns,
            models,
            managers,
            osago,
            informants,
            vehicle,
            lasticket,
            onticks,
            error,
            back,
            has,
            save,
            remove,
            extloading: false
        };
    },   //setup
    mounted(){
        this.$nextTick(()=>{
            $(this.$el).find("input[type=tel]").each(function(e){
                Inputmask({mask: _PH_MASK}).mask(this);
            });
        });
    },
    methods: {
        onsheets(e){
            (
                    ('boolean' === typeof e)&&(!!e)
            ) || ('boolean' !== typeof e) 
                ? this.$refs["tripTickets"].open(this.vehicle)
                : void(0);
        },
        async ongov(e){
            if ( empty(this.vehicle.gov) ){
                return;
            }
            try {
                const url = `/taxi/v1/taxi/?gov=${ this.vehicle.gov }`;
                const { data } = await $nuxt.api({ url });
                let exists = false;
                data.value.data?.forEach(d => {
                    if (d.id != this.vehicle.id){
                        exists = d.id;
                    }
                });
                if (exists){
                    $nuxt.msg({
                        text:`Номер ${ this.vehicle.gov } уже используется в карточке № ${ exists }`, 
                        color: 'info', 
                        timeout: 20000,
                        click: ()=>{
                            $nuxt.msg();
                            useRouter().replace({name: 'taxi-id', params:{id: exists}});
                        },
                        click_title: 'Перейти к #' + exists
                    });
                }
                
            } catch(e){
                console.log('ERR (ongov)', e);
            }
        },
        async getexternal(e){
            if ( empty(this.vehicle.gov) ){
                $nuxt.msg({text: "Введите гос.знак"});
                return;
            }
            try {
                this.extloading = true;
                const url = `/taxi/v1/taxi/?remote=1&gov=${ this.vehicle.gov }`;
                const { data } = await $nuxt.api({ url });
                if (
                        (data.value.success)
                      &&(data.value.data.length > 0)
                   ){
                    const vc = data.value.data[0];
                    this.vehicle.model   = vc.vckindname + ' ' + vc.model;
                    this.vehicle.permDt  = new Date(vc.regdt);
                    this.vehicle.permNum = vc.regnum;
                    this.vehicle.status  = /(недейст)+/.test(vc.state) ? 'off' : 'on';
                    $nuxt.msg({text: "Данные обновлены", color: "info"});
                } else {
                    $nuxt.msg({text: `запрошенный номер ${this.vehicle.gov} не найден`, color: "warning"});
                }
            } catch(e){
                $nuxt.msg({text: "Ошибка получения данных"});
            } finally {
                this.extloading = false;
            }
        }   //getexternal
    }
};
</script>
<style lang="scss" scoped>
    .cb-taxi{
        & .v-col-12{
            padding-top: 0.25rem;
            padding-bottom: 0.25rem;
        }
        & .text-subtitle-1{
            margin-top: 1rem;
            line-height: 1.115;
            color: #26A69A;
            & .v-icon{
                margin-right: 1rem;
                font-size: 1rem;
            }
        }
        & .v-card{
            &-actions{
            }
        }
    }
</style>