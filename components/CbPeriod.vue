<template>
    <v-dialog v-model="show"
              max-width="400"
              content-class="cb-period">
        <v-form v-on:submit.stop.prevent="set">
            <v-card>
                <v-card-title>Период</v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="8">
                            <v-autocomplete label="месяц"
                                        item-title="name"
                                        item-value="id"
                                        autocomplete="off"
                                        :return-object="false"
                                        :items="MONTHS"
                                        v-model="month">
                            </v-autocomplete>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-text-field label="год"
                                          v-model="year">
                            </v-text-field>
                        </v-col>    
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-btn v-on:click="show = false"
                           size="small">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn type="submit"
                           size="small"
                           variant="elevated"
                           color="primary">
                        ok
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
</template>
<script>
    import { MONTH_NAMES as MONTHS } from "~/utils";
    import { useSettingsStore } from "~/store/settings";
    
    export default {
        name: 'CbPeriod',
        data(){
            return {
                MONTHS,
                year: 0,
                month: 0,
                show: false
            };
        },
        methods: {
            open(){
                const { period } = useSettingsStore().settings.local;
                this.year = period.year;
                this.month = period.month;
                this.show = true;
                this.$nextTick(()=>{
                    $($(this.$el).find("input").get(0)).trigger("focus");
                });
            },
            set(){
                const store = useSettingsStore();
                const { period } = store.settings.local;
                period.year = this.year;
                period.month = this.month;
                store.save();
                this.show = false;
                this.$emit("change", period);
            }
        }
    }
</script>
<style lang="scss" scoped>
    .cb-period{
        & .v-card{
            &-actions{
                justify-content: flex-end;
            }
        }
    }
</style>