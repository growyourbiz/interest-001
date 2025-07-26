// script.js

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลขให้มีเครื่องหมาย , คั่นหลักพัน
// และอนุญาตให้มีทศนิยมได้
function formatNumberInput(input) {
    // เก็บตำแหน่ง cursor ก่อนที่จะเปลี่ยนค่า input
    const originalCursorPos = input.selectionStart;
    const originalValue = input.value;
    const initialLength = originalValue.length;

    // ลบเครื่องหมาย , ทั้งหมดออกก่อนประมวลผล
    let value = originalValue.replace(/,/g, '');
    
    // ตรวจสอบว่าเป็นตัวเลขที่ถูกต้องหรือไม่ หรือเป็นแค่จุดทศนิยม
    if (value === '' || value === '-' || value === '.') {
        // หากว่างเปล่า, ลบเครื่องหมายลบ, หรือเป็นแค่จุด ให้คืนค่าเดิม
        return; 
    }
    
    // ตรวจสอบว่ามีจุดทศนิยมหรือไม่
    const hasDecimal = value.includes('.');
    let parts = value.split('.');
    let wholePart = parts[0];
    let decimalPart = parts.length > 1 ? '.' + parts[1] : '';

    // เพิ่มเครื่องหมาย , คั่นหลักพันในส่วนจำนวนเต็ม
    let formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // รวมส่วนจำนวนเต็มและทศนิยมกลับเข้าด้วยกัน
    input.value = formattedWholePart + decimalPart;

    // พยายามรักษาระดับ cursor ให้ใกล้เคียงเดิม
    const newLength = input.value.length;
    const adjustment = newLength - initialLength;
    const newCursorPos = originalCursorPos + adjustment;
    input.setSelectionRange(newCursorPos, newCursorPos);
}

// ฟังก์ชันสำหรับจัดรูปแบบตัวเลขให้เป็นสกุลเงินไทย (มีทศนิยม 2 ตำแหน่ง)
function formatCurrency(amount) {
    // ใช้ Intl.NumberFormat เพื่อจัดรูปแบบตัวเลขตาม locale
    // 'th-TH' สำหรับรูปแบบภาษาไทย
    // minimumFractionDigits: 2 หมายถึงอย่างน้อยต้องมีทศนิยม 2 ตำแหน่ง
    // maximumFractionDigits: 2 หมายถึงมีทศนิยมได้สูงสุด 2 ตำแหน่ง
    return new Intl.NumberFormat('th-TH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }).format(amount);
}

// ฟังก์ชันหลักในการคำนวณดอกเบี้ยและแสดงผลลัพธ์
function calculateInterest() {
    // รับค่าจากช่องกรอกข้อมูล (id ของแต่ละช่อง)
    // .replace(/,/g, '') เพื่อลบเครื่องหมาย , ก่อนแปลงเป็นตัวเลข
    // parseFloat() สำหรับตัวเลขที่มีทศนิยม (เงินต้น, อัตราดอกเบี้ย)
    // parseInt() สำหรับตัวเลขจำนวนเต็ม (ระยะเวลาเดือน)
    // || 0 คือ ถ้าค่าว่างเปล่าหรือไม่เป็นตัวเลข ให้ใช้ 0 แทน เพื่อป้องกัน error

    const principal = parseFloat(document.getElementById('principal').value.replace(/,/g, '')) || 0;
    const inputRate = parseFloat(document.getElementById('rate').value.replace(/,/g, '')) || 0;
    const rateType = document.getElementById('rateType').value; // 'yearly' หรือ 'monthly'
    const months = parseInt(document.getElementById('months').value.replace(/,/g, '')) || 0;
    const interestType = document.getElementById('interestType').value; // 'simple' หรือ 'compound'

    // ตรวจสอบข้อมูลเบื้องต้นก่อนคำนวณ
    if (principal <= 0 || inputRate <= 0 || months <= 0) {
        // ถ้าข้อมูลไม่ถูกต้อง ให้เคลียร์ผลลัพธ์และแสดงข้อความแจ้งเตือน
        document.getElementById('resultPrincipal').textContent = '0.00 บาท';
        document.getElementById('resultRate').textContent = '0.00% ต่อปี';
        document.getElementById('resultTime').textContent = '0 เดือน';
        document.getElementById('resultInterest').textContent = '0.00 บาท';
        document.getElementById('resultTotal').textContent = '0.00 บาท';
        document.getElementById('resultMonthlyPayment').textContent = '0.00 บาท';
        document.getElementById('resultTable').innerHTML = ''; // เคลียร์ตาราง
        return; // หยุดการทำงานของฟังก์ชัน
    }

    // แปลงอัตราดอกเบี้ยให้อยู่ในรูปต่อปีเสมอ เพื่อให้ง่ายต่อการคำนวณ (ถ้าผู้ใช้เลือกต่อเดือน)
    let annualRate = inputRate;
    if (rateType === 'monthly') {
        annualRate = inputRate * 12; // ถ้ากรอกต่อเดือน ให้คูณ 12 เป็นต่อปี
    }
    
    // แปลงอัตราดอกเบี้ยเป็นทศนิยมสำหรับสูตร (เช่น 5% เป็น 0.05)
    const annualRateDecimal = annualRate / 100;

    let interest = 0; // ดอกเบี้ยรวม
    let total = 0;    // ยอดรวมทั้งหมด (เงินต้น + ดอกเบี้ย)
    let monthlyPayment = 0; // ค่างวดต่อเดือน
    
    // Logic การคำนวณดอกเบี้ยตามประเภทที่เลือก
    if (interestType === 'simple') {
        // ดอกเบี้ยธรรมดา (Simple Interest)
        // สูตร: I = P * R * T (เงินต้น * อัตราดอกเบี้ยต่อปี * ระยะเวลาเป็นปี)
        interest = principal * annualRateDecimal * (months / 12);
        total = principal + interest;
        
        // ค่างวดต่อเดือนสำหรับดอกเบี้ยธรรมดา: แบ่งเงินต้นและดอกเบี้ยรวมเท่าๆ กัน
        monthlyPayment = months > 0 ? total / months : 0;
        
    } else { // interestType === 'compound'
        // ดอกเบี้ยทบต้น (Compound Interest) - ใช้สูตรการผ่อนชำระแบบเท่ากันทุกเดือน (Amortization)
        // สูตร PMT (Payment per period)
        const monthlyRate = annualRateDecimal / 12; // อัตราดอกเบี้ยต่อเดือน (เป็นทศนิยม)
        
        if (monthlyRate === 0) { // กรณีดอกเบี้ย 0%
            monthlyPayment = principal / months;
        } else {
            // สูตร PMT: P * [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            // P = principal (เงินต้น)
            // i = monthlyRate (อัตราดอกเบี้ยต่อเดือน)
            // n = months (จำนวนงวดทั้งหมด)
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        }
        
        total = monthlyPayment * months; // ยอดรวมทั้งหมด = ค่างวดต่อเดือน * จำนวนงวด
        interest = total - principal;    // ดอกเบี้ยรวม = ยอดรวมทั้งหมด - เงินต้น
    }
    
    // แสดงผลลัพธ์ในส่วน "ผลการคำนวณ"
    document.getElementById('resultPrincipal').textContent = formatCurrency(principal) + ' บาท';
    document.getElementById('resultRate').textContent = inputRate.toFixed(2) + '% ' + 
                                                         (rateType === 'yearly' ? 'ต่อปี' : 'ต่อเดือน') + 
                                                         (rateType === 'monthly' ? ' (' + annualRate.toFixed(2) + '% ต่อปี)' : ''); // แสดงอัตราต่อปีด้วยถ้าผู้ใช้เลือกต่อเดือน
    document.getElementById('resultTime').textContent = months + ' เดือน';
    document.getElementById('resultInterest').textContent = formatCurrency(interest) + ' บาท';
    document.getElementById('resultTotal').textContent = formatCurrency(total) + ' บาท';
    document.getElementById('resultMonthlyPayment').textContent = formatCurrency(monthlyPayment) + ' บาท';
    
    // สร้างและแสดงตารางรายละเอียดการผ่อนชำระ
    generateTable(principal, annualRate, months, interestType, monthlyPayment);
}

// ฟังก์ชันสำหรับสร้างตารางรายละเอียดการผ่อนชำระ
function generateTable(principal, annualRate, months, interestType, monthlyPayment) {
    const tableBody = document.getElementById('resultTable');
    tableBody.innerHTML = ''; // เคลียร์ข้อมูลเก่าในตารางก่อนสร้างใหม่
    
    // ถ้าไม่มีข้อมูลระยะเวลา หรือเงินต้นเป็น 0 ไม่ต้องสร้างตาราง
    if (months === 0 || principal === 0) {
        return;
    }
    
    // กำหนดจำนวนงวดที่จะแสดงในตาราง (แสดงไม่เกิน 12 งวดแรก)
    const displayMonths = Math.min(months, 12);
    
    let remainingPrincipal = principal; // เงินต้นคงเหลือเริ่มต้น
    const monthlyRate = (annualRate / 100) / 12; // อัตราดอกเบี้ยต่อเดือน (เป็นทศนิยม)
    
    for (let i = 1; i <= displayMonths; i++) {
        const row = document.createElement('tr'); // สร้างแถวใหม่
        
        // กำหนด class สำหรับแรเงาสลับแถว (odd-row/even-row) เพื่อให้ดูง่ายขึ้น
        if (i % 2 === 0) {
            row.classList.add('even-row');
        } else {
            row.classList.add('odd-row');
        }
        
        let monthlyInterest = 0;  // ดอกเบี้ยต่องวด
        let monthlyPrincipal = 0; // เงินต้นที่ตัดต่องวด
        
        if (interestType === 'simple') {
            // ดอกเบี้ยธรรมดา: ดอกเบี้ยและเงินต้นถูกแบ่งเท่าๆ กันทุกเดือน
            const totalInterestForSimple = principal * (annualRate / 100) * (months / 12);
            monthlyInterest = totalInterestForSimple / months;
            monthlyPrincipal = principal / months;
            remainingPrincipal = principal - (monthlyPrincipal * i); // คำนวณเงินต้นคงเหลือ
        } else { // ดอกเบี้ยทบต้น (Compound Interest)
            // คำนวณแบบลดต้นลดดอก
            monthlyInterest = remainingPrincipal * monthlyRate; // ดอกเบี้ยจากเงินต้นคงเหลือปัจจุบัน
            monthlyPrincipal = monthlyPayment - monthlyInterest; // เงินต้นที่ตัด = ค่างวด - ดอกเบี้ย
            remainingPrincipal = remainingPrincipal - monthlyPrincipal; // เงินต้นคงเหลือ
        }
        
        // ป้องกันไม่ให้เงินต้นคงเหลือติดลบในงวดสุดท้าย
        if (remainingPrincipal < 0) remainingPrincipal = 0;
        
        // ใส่ข้อมูลลงในเซลล์ของแถว
        row.innerHTML = `
            <td class="py-2 px-2 sm:px-3 border-t border-gray-200">${i}</td>
            <td class="py-2 px-2 sm:px-3 border-t border-gray-200">${formatCurrency(remainingPrincipal)}</td>
            <td class="py-2 px-2 sm:px-3 border-t border-gray-200">${formatCurrency(monthlyInterest)}</td>
            <td class="py-2 px-2 sm:px-3 border-t border-gray-200">${formatCurrency(monthlyPrincipal)}</td>
            <td class="py-2 px-2 sm:px-3 border-t border-gray-200 font-medium">${formatCurrency(monthlyPayment)}</td>
        `;
        
        tableBody.appendChild(row); // เพิ่มแถวเข้าในตาราง
    }
    
    // ถ้ามีงวดมากกว่า 12 เดือน ให้แสดงข้อความแจ้งเตือนว่าแสดงแค่บางส่วน
    if (months > 12) {
        const lastRow = document.createElement('tr');
        lastRow.classList.add('bg-blue-50'); // เพิ่มสีพื้นหลังพิเศษ
        lastRow.innerHTML = `
            <td colspan="5" class="py-2 px-2 sm:px-3 text-center text-gray-500 border-t border-gray-200">
                ... แสดงเฉพาะ 12 งวดแรก จากทั้งหมด ${months} งวด ...
            </td>
        `;
        tableBody.appendChild(lastRow);
    }
}

// --- การเรียกใช้งานเมื่อหน้าเว็บโหลดเสร็จ และการจัดการเหตุการณ์ ---
document.addEventListener('DOMContentLoaded', function() {
    // กำหนด Event Listener สำหรับการจัดรูปแบบตัวเลขเมื่อผู้ใช้พิมพ์
    document.getElementById('principal').addEventListener('input', function() {
        formatNumberInput(this);
    });
    
    document.getElementById('rate').addEventListener('input', function() {
        formatNumberInput(this);
    });
    
    document.getElementById('months').addEventListener('input', function() {
        formatNumberInput(this);
    });
    
    // กำหนด Event Listener สำหรับปุ่ม "คำนวณ"
    document.getElementById('calculate').addEventListener('click', function() {
        calculateInterest(); // เรียกฟังก์ชันคำนวณ
        
        // เลื่อนหน้าจอไปยังส่วนแสดงผลลัพธ์อย่างนุ่มนวล
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' // เลื่อนให้ส่วนเริ่มต้นของ resultSection อยู่ด้านบนของ viewport
        });
    });
    
    // เพิ่ม Event Listener สำหรับการคำนวณอัตโนมัติเมื่อมีการเปลี่ยนแปลงค่าใน input/select
    // หรือเมื่อกด Enter (ใน input)
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('change', calculateInterest); // เมื่อค่าเปลี่ยน (เช่น เลือก dropdown)
        element.addEventListener('keyup', function(e) {
            // เมื่อกดปุ่ม Enter
            if (e.key === 'Enter') {
                calculateInterest();
                document.getElementById('resultSection').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start' 
                });
            }
        });
    });

    // เรียก calculateInterest() ครั้งแรกเพื่อให้แสดงค่าเริ่มต้น 0.00
    // หากไม่ต้องการให้แสดงค่าเริ่มต้น ให้ลบบรรทัดนี้ออก
    calculateInterest();
});
