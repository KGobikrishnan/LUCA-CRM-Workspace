import React, { useMemo } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import Logo from '../../assets/logo.png'; // Assuming this exists

const DocumentViewerModal = ({ isOpen, onClose, documentData, type, client, lead }) => {
  if (!isOpen || !documentData) return null;

  const handlePrint = () => {
    const content = document.getElementById('printable-document').outerHTML;
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'absolute';
    printIframe.style.width = '0px';
    printIframe.style.height = '0px';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
    
    // Copy all current styles to iframe
    const styles = document.head.innerHTML;
    
    const iframeDoc = printIframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>${title}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              margin: 0; 
              padding: 0; 
              background: white; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            #printable-document { 
              box-shadow: none !important; 
              width: 100% !important; 
              max-width: 100% !important; 
              margin: 0 !important; 
              height: auto !important; 
              max-height: none !important; 
              overflow: visible !important;
            }
            .no-print { display: none !important; }
            tr, .page-break-avoid { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // Wait for images to load before printing
    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printIframe);
      }, 1000);
    }, 500);
  };

  const title = type === 'invoice' ? 'Invoice' : type === 'quotation' ? 'Quotation' : 'Payment Receipt';
  
  // Data extraction
  const docId = documentData.invoiceId || documentData.quotationId || documentData.receiptId || '-';
  const docDate = documentData.createdAt ? documentData.createdAt.split('T')[0] : (documentData.paymentDate || '-');
  const clientId = client?.clientId || client?.id || lead?.leadId || lead?.id || '-';
  
  const entityName = type === 'quotation' && documentData.isForLead 
    ? (lead?.companyOrg || lead?.leadName) 
    : (client?.businessName || client?.name);
    
  const entityPhone = type === 'quotation' && documentData.isForLead ? lead?.phone : client?.phone;
  const entityEmail = type === 'quotation' && documentData.isForLead ? lead?.email : client?.email;
  const entityAddress = type === 'quotation' && documentData.isForLead ? lead?.address : client?.address;

  // Items processing
  let items = [];
  if (type === 'receipt') {
    // Receipts might not have items, fake one based on amount
    items = [{
      name: documentData.paymentPurpose || 'Payment Received',
      id: documentData.referenceNumber || '-',
      qty: 1,
      price: documentData.amount,
      finalPriceApplied: documentData.amount
    }];
  } else {
    try {
      items = typeof documentData.items === 'string' ? JSON.parse(documentData.items) : (documentData.items || []);
    } catch (e) {
      items = [];
    }
  }

  // Terms processing
  let customTerms = [];
  try {
    customTerms = typeof documentData.customTerms === 'string' ? JSON.parse(documentData.customTerms) : (documentData.customTerms || []);
  } catch(e) {
    customTerms = [];
  }

  // Formatting helper
  const fC = (val) => formatCurrency(val || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:block">
      
      {/* Removing global print styles as we now use isolated iframe printing for perfect multipage rendering */}

      {/* Modal Actions - Hidden on print */}
      <div className="absolute top-4 right-4 flex gap-2 no-print z-[110]">
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg font-medium transition-colors">
          <Printer className="w-4 h-4" /> Print / Download
        </button>
        <button onClick={onClose} className="p-2 bg-white text-slate-600 rounded-lg hover:bg-slate-100 shadow-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* A4 Container */}
      <div 
        id="printable-document" 
        className="bg-white w-full max-w-[210mm] min-h-[297mm] h-auto rounded-xl shadow-2xl mx-auto flex flex-col relative overflow-hidden print:shadow-none print:rounded-none overflow-y-auto max-h-[90vh] print:max-h-none print:overflow-visible custom-scrollbar"
      >
        <div className="p-10 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b-[3px] border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Logo" className="h-16 object-contain" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <div className="text-right">
              <h1 className="text-[42px] font-black tracking-wider text-[#1e4e8c] uppercase leading-none">{title}</h1>
              <p className="text-[#f59e0b] font-bold text-lg mt-1 tracking-wide">Quality Services at Competitive Prices</p>
            </div>
          </div>

          {/* Meta Bar */}
          <div className="flex border-2 border-slate-800 mb-8">
            <div className="flex-1 flex border-r-2 border-slate-800">
              <div className="bg-slate-100 font-bold px-4 py-2 border-r-2 border-slate-800 whitespace-nowrap text-sm flex items-center justify-center w-32">{type === 'receipt' ? 'Receipt ID' : (type === 'quotation' ? 'Quotation ID' : 'Invoice ID')}</div>
              <div className="px-4 py-2 font-semibold text-sm flex-1 flex items-center justify-center">{docId}</div>
            </div>
            <div className="flex-1 flex border-r-2 border-slate-800">
              <div className="bg-slate-100 font-bold px-4 py-2 border-r-2 border-slate-800 whitespace-nowrap text-sm flex items-center justify-center w-24">Date</div>
              <div className="px-4 py-2 font-semibold text-sm flex-1 flex items-center justify-center">{docDate}</div>
            </div>
            <div className="flex-1 flex">
              <div className="bg-slate-100 font-bold px-4 py-2 border-r-2 border-slate-800 whitespace-nowrap text-sm flex items-center justify-center w-24">Client ID</div>
              <div className="px-4 py-2 font-semibold text-sm flex-1 flex items-center justify-center">{clientId}</div>
            </div>
          </div>

          {/* To Section */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-800 mb-1">TO:</h3>
            <h2 className="font-black text-xl text-slate-900 uppercase">{entityName || 'UNKNOWN CLIENT'}</h2>
          </div>

          {/* Client Details Table */}
          <div className="border-2 border-slate-800 mb-8 flex text-sm">
            <div className="flex-1 flex border-r-2 border-slate-800">
              <div className="font-bold px-3 py-2 border-r-2 border-slate-800 w-20 flex items-center">Phone</div>
              <div className="px-3 py-2 flex-1 flex items-center">{entityPhone || '-'}</div>
            </div>
            <div className="flex-1 flex border-r-2 border-slate-800">
              <div className="font-bold px-3 py-2 border-r-2 border-slate-800 w-20 flex items-center">Email</div>
              <div className="px-3 py-2 flex-1 flex items-center break-all">{entityEmail || '-'}</div>
            </div>
            <div className="flex-1 flex">
              <div className="font-bold px-3 py-2 border-r-2 border-slate-800 w-24 flex items-center">Company</div>
              <div className="px-3 py-2 flex-1 flex items-center">{entityName || '-'}</div>
            </div>
          </div>
          <div className="border-x-2 border-b-2 border-t-0 border-slate-800 -mt-[34px] flex text-sm mb-8">
            <div className="font-bold px-3 py-2 border-r-2 border-slate-800 w-20 flex items-center">Address</div>
            <div className="px-3 py-2 flex-1 flex items-center">{entityAddress || '-'}</div>
          </div>

          {/* Background Watermark (Optional) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
             {/* If logo was large, it could be placed here as a watermark */}
             <img src={Logo} alt="" className="w-96" />
          </div>

          {/* Items Table */}
          <div className="mb-8 relative z-10">
            <table className="w-full border-collapse border-2 border-[#1e4e8c]">
              <thead>
                <tr className="bg-[#1e4e8c] text-white">
                  <th className="border-2 border-[#1e4e8c] px-3 py-3 text-center w-12 font-bold text-sm">S.No</th>
                  <th className="border-2 border-[#1e4e8c] px-4 py-3 text-left font-bold text-sm">Item/Service</th>
                  <th className="border-2 border-[#1e4e8c] px-3 py-3 text-center font-bold text-sm">Item/Service ID</th>
                  <th className="border-2 border-[#1e4e8c] px-3 py-3 text-center font-bold text-sm">Quantity</th>
                  <th className="border-2 border-[#1e4e8c] px-3 py-3 text-right font-bold text-sm">Unit Price<br/><span className="text-xs font-normal">(INR)</span></th>
                  <th className="border-2 border-[#1e4e8c] px-3 py-3 text-right font-bold text-sm">Total Price<br/><span className="text-xs font-normal">(INR)</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const qty = parseFloat(item.qty) || 1;
                  const price = type === 'receipt' ? parseFloat(item.price || 0) : parseFloat(item.finalPriceApplied || item.price || 0);
                  const total = qty * price;
                  
                  return (
                    <tr key={index}>
                      <td className="border-x-2 border-b border-slate-400 px-3 py-4 text-center font-semibold text-sm">{String(index + 1).padStart(2, '0')}</td>
                      <td className="border-x-2 border-b border-slate-400 px-4 py-4 text-sm">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-2 pl-2">
                            <span className="text-xs font-semibold text-slate-600 block mb-0.5">Addons:</span>
                            <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
                              {item.addons.map((a, i) => <li key={i}>{a.name}</li>)}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td className="border-x-2 border-b border-slate-400 px-3 py-4 text-center font-semibold text-sm text-slate-600">{item.id || '-'}</td>
                      <td className="border-x-2 border-b border-slate-400 px-3 py-4 text-center font-semibold text-sm">{qty}</td>
                      <td className="border-x-2 border-b border-slate-400 px-3 py-4 text-right font-semibold text-sm">{fC(price).replace('₹','')}</td>
                      <td className="border-x-2 border-b border-slate-400 px-3 py-4 text-right font-semibold text-sm">{fC(total).replace('₹','')}</td>
                    </tr>
                  );
                })}
                {/* Empty rows filler if needed for design height, simplified here */}
                {items.length === 0 && (
                  <tr><td colSpan="6" className="border-x-2 border-b border-slate-400 px-3 py-8 text-center text-slate-400">No items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between mt-auto relative z-10 gap-8">
            
            {/* Left: Bank Details & Terms */}
            <div className="w-3/5">
              <div className="mb-6">
                <h4 className="text-[#f59e0b] font-black text-sm uppercase mb-2">Bank Details:</h4>
                <div className="text-sm font-semibold text-slate-800 leading-tight space-y-1">
                  <p>Account Name: <span className="font-black">NAVI PROMOTIONS</span></p>
                  <p>Account Number: <span className="font-black">43842008945</span></p>
                  <p>IFSC code: <span className="font-black">SBIN0013834</span></p>
                  <p>UPI ID: <span className="font-black">9789705885@okbizaxis</span></p>
                </div>
              </div>

              <div>
                <h4 className="text-[#f59e0b] font-black text-sm uppercase border-b-2 border-slate-400 pb-1 mb-2 inline-block">Terms and Conditions</h4>
                <ul className="list-disc pl-4 text-xs font-semibold text-slate-700 space-y-1">
                  {customTerms.length > 0 ? (
                    customTerms.map((term, i) => <li key={i}>{term}</li>)
                  ) : (
                    <>
                      <li>Payment must be completed within 5 days of the issue date.</li>
                      <li>Applicable taxes and charges are included as per current rates.</li>
                      <li>No refunds once the service/project is initiated.</li>
                    </>
                  )}
                </ul>
                <p className="text-[#f59e0b] font-bold text-sm italic mt-4 text-center">Thank You For Your Business..!</p>
              </div>
            </div>

            {/* Right: Calculations */}
            <div className="w-2/5 flex flex-col justify-between">
              <div className="space-y-2 mb-8">
                {type !== 'receipt' && (
                  <>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">Sub-Total :</span>
                      <span className="text-slate-900">{fC(documentData.grossSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">Discount :</span>
                      <span className="text-slate-900">{fC(documentData.discountValue || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-700">Tax ({documentData.taxAmount > 0 ? '18%' : '0%'}) :</span>
                      <span className="text-slate-900">{fC(documentData.taxAmount || 0)}</span>
                    </div>
                    {type === 'invoice' && (
                      <div className="flex justify-between text-sm font-bold text-green-700 pt-2 border-t border-slate-300 mt-2">
                        <span>Paid Amt :</span>
                        <span>{fC(documentData.amountPaid || 0)}</span>
                      </div>
                    )}
                  </>
                )}

                {type === 'receipt' && documentData.invoiceTotal != null && (
                  <div className="flex justify-between text-sm font-bold border-b border-slate-300 pb-2 mb-2">
                    <span className="text-slate-700">Invoice Total :</span>
                    <span className="text-slate-900">{fC(documentData.invoiceTotal)}</span>
                  </div>
                )}
                
                <div className="bg-[#1e4e8c] text-white p-2 flex justify-between font-bold text-sm mt-2 shadow-sm">
                  <span>{type === 'receipt' ? 'Total Paid Amt:' : (type === 'quotation' ? 'Total Quote Amt:' : 'Grand Total:')}</span>
                  <span>{fC(type === 'receipt' ? documentData.amount : documentData.total)}/-</span>
                </div>

                {type === 'invoice' && (
                  <div className="flex justify-between text-sm font-bold mt-2 pr-2 text-red-600">
                    <span>Balance Due :</span>
                    <span>{fC(Math.max(0, (documentData.total || 0) - (documentData.amountPaid || 0)))}</span>
                  </div>
                )}

                {type === 'receipt' && documentData.invoiceBalance != null && (
                  <div className="flex justify-between text-sm font-bold mt-2 pr-2 text-red-600">
                    <span>Balance Due :</span>
                    <span>{fC(documentData.invoiceBalance)}</span>
                  </div>
                )}
              </div>

              {/* Signature Area */}
              <div className="text-center self-end w-48 mt-auto">
                <div className="h-16 border-b border-slate-400 relative">
                  {/* Fake Signature Image can go here */}
                  <div className="absolute bottom-0 w-full text-center text-slate-800" style={{ fontFamily: 'cursive', fontSize: '24px' }}>Naga Vishnu. N</div>
                </div>
                <div className="mt-1 font-bold text-sm text-slate-900 uppercase">Naga Vishnu. N</div>
                <div className="text-xs font-semibold text-slate-600">FOUNDER & CEO</div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Ribbon */}
        <div className="h-4 bg-[#f59e0b] w-full mt-8"></div>
        <div className="h-6 bg-[#1e4e8c] w-full rounded-b-xl print:rounded-none"></div>

      </div>
    </div>
  );
};

export default DocumentViewerModal;
