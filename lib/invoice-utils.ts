
import { format } from "date-fns"
import type { Sale } from "@/lib/types"

export type GroupedSale = {
    id: string,
    userId: string,
    createdat: string,
    saledate: string,
    paymentMethod: string,
    customerName?: string,
    customerPhone?: string,
    items: Sale[]
}

export const generateInvoice = async (group: GroupedSale, type: 'A4' | 'THERMAL', org?: { name: string, gstin?: string }) => {
    const businessName = org?.name?.toUpperCase() || "KHATAPLUS"
    const businessGstin = org?.gstin || "18AABCG1234A1Z5"
    try {
        const jsPDF = (await import("jspdf")).default
        const autoTable = (await import("jspdf-autotable")).default

        if (type === 'A4') {
            const doc = new jsPDF()
            const primaryColor = [22, 163, 74]

            // Header background
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.rect(0, 0, 210, 40, 'F')

            doc.setFontSize(26)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(255, 255, 255)
            doc.text(businessName, 105, 20, { align: "center" })

            doc.setFontSize(9)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(200, 255, 200)
            doc.text("The Business Operating System • support@khataplus.in", 105, 27, { align: "center" })
            doc.text(`GSTIN: ${businessGstin}`, 105, 32, { align: "center" })

            doc.setDrawColor(230, 230, 230)

            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.setTextColor(0, 0, 0)
            doc.text("TAX INVOICE", 14, 52)

            doc.setFontSize(9)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(120, 120, 120)
            doc.text(`Invoice No: INV-${group.id.slice(0, 8).toUpperCase()}`, 14, 59)
            doc.text(`Date: ${format(new Date(group.saledate), "dd-MMM-yyyy")}`, 14, 64)

            doc.setTextColor(0, 0, 0)
            doc.setFont("helvetica", "bold")
            doc.text("Bill To:", 130, 50)
            doc.setFont("helvetica", "normal")
            doc.text("Counter Sale / Cash Customer", 130, 56)
            doc.text(`Order ID: ${group.id.split('-')[0]}`, 130, 61)

            const columns = ["#", "Item Description", "Qty", "Rate", "Taxable", "CGST", "SGST", "Amount"]
            let totalTaxable = 0
            let totalGst = 0
            let grandTotal = 0

            const rows = group.items.map((sale, idx) => {
                const item = sale.inventory
                const rate = sale.sale_price
                const qty = sale.quantity
                const total = sale.total_amount
                const gstAmt = sale.gst_amount
                const taxable = total - gstAmt

                totalTaxable += taxable
                totalGst += gstAmt
                grandTotal += total

                return [
                    String(idx + 1),
                    item?.name || "Product",
                    String(qty),
                    rate.toFixed(2),
                    taxable.toFixed(2),
                    (gstAmt / 2).toFixed(2),
                    (gstAmt / 2).toFixed(2),
                    total.toFixed(2)
                ]
            })

            autoTable(doc, {
                head: [columns],
                body: rows,
                startY: 70,
                theme: 'striped',
                headStyles: {
                    fillColor: primaryColor as any,
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { cellWidth: 60 },
                    2: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right', fontStyle: 'bold' }
                },
                styles: { fontSize: 8, cellPadding: 3 }
            })

            const finalY = (doc as any).lastAutoTable.finalY + 10
            doc.setDrawColor(240, 240, 240)
            doc.setFillColor(252, 252, 252)
            doc.rect(130, finalY, 66, 35, 'F')

            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text("Total Taxable Value:", 135, finalY + 8)
            doc.text("Total Tax (GST):", 135, finalY + 15)

            doc.setFont("helvetica", "bold")
            doc.setTextColor(0, 0, 0)
            doc.text(totalTaxable.toFixed(2), 191, finalY + 8, { align: "right" })
            doc.text(totalGst.toFixed(2), 191, finalY + 15, { align: "right" })

            doc.line(135, finalY + 20, 191, finalY + 20)

            doc.setFontSize(11)
            doc.text("GRAND TOTAL:", 135, finalY + 28)
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.text(`Rs. ${grandTotal.toFixed(2)}`, 191, finalY + 28, { align: "right" })

            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text("Terms & Conditions:", 14, 250)
            doc.text("1. Goods once sold cannot be returned.", 14, 255)
            doc.text("2. This is a computer generated document.", 14, 260)

            doc.setTextColor(0, 0, 0)
            doc.setFont("helvetica", "bold")
            doc.text(`For ${businessName}`, 150, 255)
            doc.line(145, 270, 190, 270)
            doc.text("Authorized Signatory", 150, 275)

            doc.save(`Invoice_${group.id.split('-')[0].toUpperCase()}.pdf`)
        }

        else if (type === 'THERMAL') {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [80, 200]
            })

            let y = 10
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text(businessName, 40, y, { align: "center" })
            y += 5
            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.text(`GSTIN: ${businessGstin}`, 40, y + 4, { align: "center" })
            y += 10

            doc.text(`Date: ${format(new Date(group.saledate), "dd/MM/yy HH:mm")}`, 5, y)
            y += 4
            doc.text(`Bill ID: ${group.id.split('-')[0].toUpperCase()}`, 5, y)
            y += 6

            doc.line(5, y, 75, y)
            y += 4

            doc.setFont("helvetica", "bold")
            doc.text("ITEM", 5, y)
            doc.text("QTY", 45, y, { align: "right" })
            doc.text("AMOUNT", 75, y, { align: "right" })
            y += 4
            doc.line(5, y, 75, y)
            y += 4

            doc.setFont("helvetica", "normal")
            let totalAmt = 0
            group.items.forEach(sale => {
                const name = sale.inventory?.name || "Product"
                doc.text(name.substring(0, 18), 5, y)
                doc.text(String(sale.quantity), 45, y, { align: "right" })
                doc.text(sale.total_amount.toFixed(2), 75, y, { align: "right" })
                y += 5
                totalAmt += sale.total_amount
            })

            y += 2
            doc.line(5, y, 75, y)
            y += 6

            doc.setFont("helvetica", "bold")
            doc.setFontSize(11)
            doc.text("NET PAYABLE:", 5, y)
            doc.text(`Rs. ${totalAmt.toFixed(2)}`, 75, y, { align: "right" })
            y += 8

            doc.setFontSize(8)
            doc.setFont("helvetica", "normal")
            doc.text("--- Thank You ---", 40, y, { align: "center" })

            doc.autoPrint()
            window.open(doc.output('bloburl'), '_blank')
        }

    } catch (err) {
        console.error(err)
        throw new Error("Failed to generate invoice")
    }
}
