import { empty, MONTH_NAMES as MONTHS } from "~/utils";
import { useDataStore } from "~/store/data";
import { useSettingsStore } from "~/store/settings";
import $moment from "moment";
$moment.locale('ru');

const _REP_COLS = [
    {title: 'Дата внесения', name: 'date'},
    {title: 'Марка/модель', name: 'model'},
    {title: 'Гос.номер', name: 'gov'},
    {title: 'Дата выдачи разрешения', name: 'permDt'},
    {title: 'Номер разрешения', name: 'permNum'},
    {title: 'ФИО собственник ТС', name: 'ownName'},
    {title: 'Телефон собственника', name: 'ownTel'},
    {title: 'Номер договора', name: 'contraNum'},
    {title: 'Фио водителя', name: 'drivName'},
    {title: 'Телефон водителя', name: 'drivTel'},
    {title: 'Город', name: 'town'},
    {title: 'Путевки: количество', name: 'lastTick'},
    {title: 'Путевки: дата', name: 'lastTick'},
    {title: 'Вид оплаты', name: 'lastTick'},
    {title: 'Оплаты', name: 'payments'},
    {title: 'Менеджер', name: 'manaName'},
    {title: 'Статус (действующий/недействующий)', name: 'status'},
    {title: 'Дата техосмотра', name: 'techDt'},
    {title: 'Особые отметки', name: 'notes'}
];
        
export const report = async () => {
    const vehicles = useDataStore().vehiclesAll;
    if (vehicles?.length < 1){
        $nuxt.msg({text: "Нет данных для вывода"});
        return;
    }

    const { period } = useSettingsStore().settings.local;
    let n = MONTHS.findIndex( m => m.id === period.month ),
        s = `${ n < 0 ? 'янв' : MONTHS[n].name}, ${period.year}`;
    
    try {
        
        await import("./report.min.js");
        
        const book = new $xl.Workbook();
        const border = {
            left: {
                style: 'thin',
                color: '#000000'
            },
            right: {
                style: 'thin',
                color: '#000000'
            },
            top: {
                style: 'thin',
                color: '#000000'
            },
            bottom: {
                style: 'thin',
                color: '#000000'
            }
        },
        caption = book.createStyle({
            font: {
                color: '#000000',
                size: 12,
                bold: true
            }
        }),
        title = book.createStyle({
            font: { color: '#000000', size: 10 },
            alignment: {
                horizontal: 'center',
                vertical  : 'center',
                wrapText  : true
            },
            fill: {
                type: 'gradient',
                bgColor: '#C0C0C0',
                patternType: 'solid'
            },
            border: border
        }),
        int_cell = book.createStyle({
            font: { size: 10 },
            border: border,
            numberFormat: '#,##0'
        }),
        date_cell = book.createStyle({
            font: { size: 10 },
            border: border,
            numberFormat: 'dd.mm.yyyy'
        }),
        def_cell = book.createStyle({
            font: { size: 10 },
            border: border
        });
        const sheet = book.addWorksheet("ТС");
        
        sheet.cell(1, 1, 1, _REP_COLS.length, true)
            .string("Сводный отчет за период" + s)
            .style(caption);
        _REP_COLS.forEach( (col, c) => {
            sheet.cell(2, c + 1)
                .string(col.title)
                .style(title);
        });

        vehicles.forEach( (vc, row) =>{
            _REP_COLS.forEach( (col, c) => {
                let s = empty(vc[col.name]) ? false : vc[col.name];
                if ( 
                        ("payments"===col.name)
                      &&(vc.ticks?.length > 0)
                   ){
                    s = vc.ticks
                            .filter( t => !!t.pay )
                            .map( t => { 
                                    return `${ $moment(t.dt).format("MMM YYYY") }: ${ t.pay }`
                                })
                            .join(" | ");
                }
                if ( s ){
                    switch(col.name){
                        case 'status':
                            s = (s === "on") ? "Действующий" : "недействующий";
                            break;
                        case 'lastTick':
                            s = /(дата)+/.test(col.title) 
                                    ? vc.lastTick.dt.format('DD.MM.YYYY') 
                                    : /(оплат)+/i.test(col.title)
                                        ? vc.lastTick.pay
                                        : vc.lastTick.num;
                            break;
                    }
                    sheet.cell(row + 3, c + 1).string(s).style(def_cell);
                }
            });
        });
        
        
        book.writeToBuffer().then(function(buffer) {
            const blob = new Blob([buffer], {type: 'application/vnd.ms-excel'});
            const url = URL.createObjectURL(blob);
            const ref = document.createElement('a');
            ref.href = url;
            document.body.appendChild(ref);
            ref.click();
            document.body.removeChild(ref);
            window.URL.revokeObjectURL(url);
        });
        
        
        
        //do_report(vehicles);
    } catch(e){
        console.log('ERR (report)', e);
        $nuxt.msg({text: "ВНИМАНИЕ! Ошибка формирования отчета.<br />Информация для технической поддержки: " + e.message});
    }
    
};