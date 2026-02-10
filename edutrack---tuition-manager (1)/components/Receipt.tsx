
import React from 'react';
import { PaymentRecord } from '../types';

interface ReceiptProps {
  payment: PaymentRecord;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ payment, onClose }) => {
  const downloadReceipt = async () => {
    const element = document.getElementById(`receipt-${payment.id}`);
    if (element) {
      // @ts-ignore
      const canvas = await window.html2canvas(element);
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Receipt-${payment.studentName}-${payment.month}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div id={`receipt-${payment.id}`} className="p-8 bg-white text-gray-900 border-8 border-primary-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary-600">EduTrack</h2>
              <p className="text-xs text-gray-500 italic">Tuition Manager</p>
            </div>
            <div className="text-right">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {payment.status}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-6 mb-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Student Name</span>
              <span className="font-semibold">{payment.studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Month</span>
              <span className="font-semibold">{payment.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-lg text-primary-700">৳ {payment.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Date</span>
              <span className="font-semibold">{payment.date}</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400">Developed by MR. MIRROR</p>
            <p className="text-[10px] text-gray-300 mt-1">Transaction ID: {payment.id}</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 flex gap-2">
          <button
            onClick={downloadReceipt}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Download as Image
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
