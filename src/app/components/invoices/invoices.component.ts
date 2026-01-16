import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../logo/logo.component';
import { FirestoreService, Invoice } from '../../services/firestore.service';

@Component({
  selector: 'app-invoices',
  imports: [CommonModule, FormsModule, RouterLink, LogoComponent],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css',
})
export class InvoicesComponent implements OnInit {
  private firestoreService = inject(FirestoreService);

  invoices = signal<Invoice[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.isLoading.set(true);
    this.firestoreService.getInvoices().subscribe((invoices) => {
      this.invoices.set(invoices);
      this.isLoading.set(false);
    });
  }

  searchTerm = signal('');
  itemsPerPage = signal(10);
  currentPage = signal(1);
  selectedInvoice = signal<Invoice | null>(null);
  showPrintModal = signal(false);
  Math = Math;

  filteredInvoices = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.invoices().filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.studentName.toLowerCase().includes(term)
    );
  });

  paginatedInvoices = computed(() => {
    const filtered = this.filteredInvoices();
    const perPage = this.itemsPerPage();
    const page = this.currentPage();
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredInvoices().length / this.itemsPerPage());
  });

  onItemsPerPageChange() {
    this.currentPage.set(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  viewInvoice(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.showPrintModal.set(true);
  }

  closeModal() {
    this.showPrintModal.set(false);
    this.selectedInvoice.set(null);
  }

  printInvoice() {
    const printContent = document.getElementById('invoice-print');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const invoice = this.selectedInvoice();
    if (!invoice) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 15mm;
            }
            
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              font-size: 12px;
              color: #000;
            }
            
            .text-center {
              text-align: center;
            }
            
            .text-end {
              text-align: right;
            }
            
            h1 {
              font-size: 24px;
              margin: 10px 0;
            }
            
            h4 {
              font-size: 18px;
              margin: 10px 0;
            }
            
            h5 {
              font-size: 14px;
              margin: 8px 0;
            }
            
            p {
              margin: 4px 0;
            }
            
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .logo .orange {
              color: #fd7e14;
            }
            
            .row {
              display: table;
              width: 100%;
              margin-bottom: 16px;
            }
            
            .col-6 {
              display: table-cell;
              width: 50%;
              vertical-align: top;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
            }
            
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            
            .table-light {
              background-color: #f0f0f0;
            }
            
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border: 1px solid #198754;
              background-color: #198754;
              color: white;
              border-radius: 3px;
              font-size: 11px;
            }
            
            strong {
              font-weight: bold;
            }
            
            .text-muted {
              color: #666;
            }
            
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="margin-bottom: 20px;">
            <div class="logo">N<span class="orange">CAGE</span></div>
            <h4>Turf Management System</h4>
          </div>

          <div class="row">
            <div class="col-6">
              <h5>Invoice Details</h5>
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoice.date}</p>
              <p><strong>Status:</strong> <span class="badge">${
                invoice.status
              }</span></p>
            </div>
            <div class="col-6 text-end">
              <h5>Bill To</h5>
              <p><strong>${invoice.studentName}</strong></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-center">Hours</th>
                <th class="text-end">Rate</th>
                <th class="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.description}</td>
                  <td class="text-center">${item.hours.toFixed(2)}</td>
                  <td class="text-end">₹${item.rate.toFixed(2)}</td>
                  <td class="text-end">₹${(item.hours * item.rate).toFixed(
                    2
                  )}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="table-light">
                <td colspan="3" class="text-end"><strong>Total Amount:</strong></td>
                <td class="text-end"><strong>₹${invoice.amount.toFixed(
                  2
                )}</strong></td>
              </tr>
            </tbody>
          </table>

          <p class="text-muted" style="margin-top: 20px;">Thank you for your business!</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getTotalPaid(): number {
    return this.invoices()
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  getTotalPending(): number {
    return this.invoices()
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  getTotalOverdue(): number {
    return this.invoices()
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }
}
