const fs = require('fs');

const replaceInFile = (file, replacements) => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        for (const [oldStr, newStr] of replacements) {
            content = content.replace(oldStr, newStr);
        }
        fs.writeFileSync(file, content);
    } catch (e) {}
};

replaceInFile('src/app/dashboard/page.tsx', [
    [/let allBarbersList: any/g, 'let allBarbersList: unknown/g', 'let allBarbersList: Record<string, unknown>']
]);

replaceInFile('src/app/dashboard/services/page.tsx', [
    [/const checkError = /g, ''] // remove 'checkError' 
]);

replaceInFile('src/components/booking/BookingWizard.tsx', [
    [/payload: any/g, 'payload: Record<string, unknown>']
]);

replaceInFile('src/components/booking/CalendarView.tsx', [
    [/day: any/g, 'day: Record<string, unknown>'],
    [/time: any/g, 'time: string']
]);

replaceInFile('src/components/booking/ContactForm.tsx', [
    [/const e = /g, 'const _e = '],
    [/const countryCodes = require\('@\/lib\/countryCodes\.json'\)/g, 'import countryCodes from "@/lib/countryCodes.json"']
]);

replaceInFile('src/components/dashboard/DateNavigator.tsx', [
    [/addWeeks, subWeeks, addMonths, subMonths, /g, '']
]);

replaceInFile('src/components/dashboard/DeleteEmployeeButton.tsx', [
    [/await await /g, 'await ']
]);

replaceInFile('src/components/dashboard/InternalBookingModal.tsx', [
    [/customer: any/g, 'customer: Record<string, unknown>'],
    [/const countryCodes = require\('@\/lib\/countryCodes\.json'\)/g, 'import countryCodes from "@/lib/countryCodes.json"']
]);

replaceInFile('src/components/dashboard/TeamRadar.tsx', [
    [/, Users, Clock, CheckCircle2/g, '']
]);

replaceInFile('src/components/dashboard/admin/AdminBookingModal.tsx', [
    [/barber: any/g, 'barber: Record<string, unknown>'],
    [/service: any/g, 'service: Record<string, unknown>'],
    [/const countryCodes = require\('@\/lib\/countryCodes\.json'\)/g, 'import countryCodes from "@/lib/countryCodes.json"']
]);

replaceInFile('src/components/dashboard/admin/AdminCalendarView.tsx', [
    [/idx: number/g, '_idx: number']
]);

replaceInFile('src/components/dashboard/admin/BusinessSettingsTabs.tsx', [
    [/, HelpCircle, ImageIcon, Type, LinkIcon/g, '']
]);

replaceInFile('src/components/dashboard/admin/CollapsibleEmployeeForm.tsx', [
    [/await await /g, 'await ']
]);

replaceInFile('src/components/dashboard/admin/ScheduleManager.tsx', [
    [/import { useRouter } from "next\/navigation"\n/g, '']
]);

replaceInFile('src/components/dashboard/admin/business/BusinessDashboard.tsx', [
    [/import jsPDF from 'jspdf'\n/g, ''],
    [/import autoTable from 'jspdf-autotable'\n/g, ''],
    [/payload: any/g, 'payload: Record<string, unknown>'],
    [/const _totalRevenue = /g, ''],
    [/const _totalServices = /g, '']
]);

replaceInFile('src/components/dashboard/barber/BarberHistory.tsx', [
    [/const _storeCut = /g, ''],
    [/a: any/g, 'a: Record<string, unknown>']
]);

replaceInFile('src/components/emails/BookingReminder.tsx', [
    [/, Img/g, '']
]);
