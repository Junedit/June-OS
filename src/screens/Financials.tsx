import React, { useState, useEffect } from "react";
import {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Search,
  Bell,
  HelpCircle,
  Wallet,
  CheckCircle,
  ArrowUp,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  ArrowRight,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  MoreHorizontal,
  PenTool,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Clock,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  RefreshCw,
  BarChart as BarChartIcon,
  Receipt,
  Download,
  Trash,
  X,
  Mail,
  Send,
  Copy,
  CreditCard,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { parseISO, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  PieChart,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Pie,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  Cell,
  Area,
  AreaChart
} from "recharts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { generateStandaloneInvoiceText } from "../services/ai";
import { toast } from "sonner";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const getCurrencySymbol = (currency?: string) => {
  switch (currency) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "CAD":
      return "CA$";
    case "AUD":
      return "A$";
    case "JPY":
      return "¥";
    case "INR":
      return "₹";
    case "USD":
    default:
      return "$";
  }
};

export const formatInvoiceDate = (dateObj: any) => {
  if (!dateObj) return new Date().toLocaleDateString();
  try {
    if (typeof dateObj?.toDate === 'function') return dateObj.toDate().toLocaleDateString();
    return new Date(dateObj).toLocaleDateString();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return new Date().toLocaleDateString();
  }
};

export default function Financials() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isStandaloneFormValid, setIsStandaloneFormValid] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);
  const [livePreviewData, setLivePreviewData] = useState<any>({ amount: 0, invoiceNumber: "INV-001", terms: "Payment is due within 30 days of the invoice date.\nLate payments are subject to a 1.5% monthly fee.\nPlease make checks payable to Junedit Design OR pay online via the attached links.", welcomeMessage: "Thank you for choosing us for this project!", additionalNotes: "We appreciate your business!" });
  const [brandColor, setBrandColor] = useState("#ea0000");
  
  const getSafeColor = (colorStr: string) => {
    return /^#[0-9A-Fa-f]{6}$/i.test(colorStr) ? colorStr : "#000000";
  };
  
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderCustomHTML = (htmlStr: string, data: any) => {
     let replaced = htmlStr || "";
     const currencySymbol = getCurrencySymbol(data?.currency);
     const amount = Number(data?.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
     const amountPaid = Number(data?.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
     const discount = Number(data?.discount || 0).toLocaleString(undefined, {minimumFractionDigits: 2});
     const formattedDate = formatInvoiceDate(data?.date || data?.createdAt);

     const replacements: Record<string, string> = {
        "{invoiceNumber}": data?.invoiceNumber || "",
        "{clientName}": data?.clientName || "",
        "{clientAddress}": data?.clientAddress || "",
        "{amount}": amount,
        "{amountPaid}": amountPaid,
        "{dueDate}": data?.dueDate || "",
        "{date}": formattedDate,
        "{senderName}": data?.senderName || "",
        "{senderEmail}": data?.senderEmail || "",
        "{senderAddress}": data?.senderAddress || "",
        "{status}": data?.status || "",
        "{brandColor}": getSafeColor(data?.brandColor || brandColor || "#ea0000"),
        "{additionalNotes}": data?.additionalNotes || "",
        "{timeline}": data?.timeline || "",
        "{logoUrl}": data?.logoUrl || "",
        "{currencySymbol}": currencySymbol,
        "{discount}": discount
     };
     
     Object.keys(replacements).forEach(key => {
        const regex = new RegExp(key.replace(/[.*+?^=!:${}()|[\]/\\]/g, "\\$&"), "g");
        replaced = replaced.replace(regex, replacements[key]);
     });
     
     return replaced;
  };
  const [invoiceTemplate, setInvoiceTemplate] = useState<
    "branded" | "minimalist" | "detailed" | "creative" | "corporate" | "callsheet" | "vhs" | "receipt" | "storyboard"
  >("branded");
  const [invoiceTexture, setInvoiceTexture] = useState<"none" | "grain" | "dirty" | "halftone">("none");
  const [pastInvoices, setPastInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);

  // Email Templates State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("default");
  const [selectedLeadIdForInvoice, setSelectedLeadIdForInvoice] = useState<string | null>(null);
  const [emailSubject, setEmailSubject] = useState("Invoice {invoiceNumber} from {senderName}");
  const [emailBody, setEmailBody] = useState("Hi {clientName},\n\nPlease find your latest invoice ({invoiceNumber}) attached or available via the payment links below.\n\nThank you,\n{senderName}");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveTemplateName, setSaveTemplateName] = useState("");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [emailTemplateModalOpen, setEmailTemplateModalOpen] = useState(false);
  const [editEmailTemplate, setEditEmailTemplate] = useState<any>(null);

  // Custom Invoice Templates State
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customInvoiceTemplates, setCustomInvoiceTemplates] = useState<any[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateHtml, setEditTemplateHtml] = useState("");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSavingCustomTemplate, setIsSavingCustomTemplate] = useState(false);
  const [partialPaymentInvoice, setPartialPaymentInvoice] = useState<any>(null);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>("");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const defaultCustomTemplateHtml = `
  <div style="font-family: inherit; padding: 40px; color: inherit;">
    <h1 style="color: {brandColor}; font-size: 2.5em; margin-bottom: 20px;">INVOICE</h1>
    <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
      <div>
        <p><strong>From:</strong></p>
        <p>{senderName}</p>
        <p>{senderEmail}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>To:</strong></p>
        <p>{clientName}</p>
        <p>Invoice #: {invoiceNumber}</p>
        <p>Due Date: {dueDate}</p>
      </div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
      <tr style="border-bottom: 2px solid #ccc;">
        <th style="text-align: left; padding: 10px;">Description</th>
        <th style="text-align: right; padding: 10px;">Amount</th>
      </tr>
      <tr>
        <td style="padding: 10px;">{desc}</td>
        <td style="text-align: right; padding: 10px;">{currencySymbol}{amount}</td>
      </tr>
      <tr>
        <td style="padding: 10px; color: #888;">Discount</td>
        <td style="text-align: right; padding: 10px; color: #888;">{currencySymbol}{discount}</td>
      </tr>
    </table>
    
    <div style="text-align: right; font-size: 1.2em;">
      <p><strong>Total: {currencySymbol}{amount}</strong></p>
      <p style="color: #888; font-size: 0.9em;">Amount Paid: {currencySymbol}{amountPaid}</p>
    </div>
    
    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #888;">
      <p>{additionalNotes}</p>
    </div>
  </div>
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const AVAILABLE_VARIABLES = [
     "{invoiceNumber}", "{clientName}", "{amount}", "{amountPaid}", "{dueDate}", "{senderName}", "{senderEmail}", "{status}", "{brandColor}", "{timeline}", "{logoUrl}", "{currencySymbol}", "{additionalNotes}", "{discount}"
  ];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const EXPENSE_CATEGORIES = [
    "Software",
    "Contractors",
    "Advertising",
    "Equipment",
    "Other",
  ];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const COLORS = ["#FFFFFF", "#FF3B30", "#FF9500", "#FFCC00", "#34C759"];

  const handleMarkInvoicePaid = async (inv: any, full: boolean) => {
    try {
      const remainingAmount = Number(inv.amount) - Number(inv.amountPaid || 0);
      let toPay = remainingAmount;
      if (!full) {
        toPay = Number(partialPaymentAmount);
        if (isNaN(toPay) || toPay <= 0 || toPay > remainingAmount) {
           toast.error("Please enter a valid partial payment amount");
           return;
        }
      }

      if (toPay <= 0) return;

      const newAmountPaid = Number(inv.amountPaid || 0) + toPay;
      const isFullyPaid = newAmountPaid >= Number(inv.amount);

      await updateDoc(doc(db, "invoices", inv.id), {
         amountPaid: newAmountPaid,
         status: isFullyPaid ? 'paid' : 'pending' 
      });
      
      if (isFullyPaid && inv.leadId) {
         // Auto-generate client onboarding portal link
         import('../services/activity').then(m => m.addGlobalActivity(`Automated Workflow: Invoice fully paid. Generated Onboarding Portal Link for Lead (${inv.leadId})`, 'system').catch(console.error));
         toast.success(`Generated Client Portal Link: ${window.location.origin}/?mode=portal&id=${inv.leadId}`, { duration: 10000 });
         
         // Mark task payment_received on the lead
         try {
           const { doc, getDoc, updateDoc } = await import("firebase/firestore");
           const leadRef = doc(db, 'leads', inv.leadId);
           const leadSnap = await getDoc(leadRef);
           if (leadSnap.exists()) {
             const leadData = leadSnap.data();
             const tasks = leadData.tasks || {};
             tasks.payment_received = true;
             await updateDoc(leadRef, { tasks });
           }
         } catch(e) {
           console.error("Failed to update lead tasks", e);
         }
      }
      
      if (inv.leadId) {
         const { increment } = await import("firebase/firestore");
         await updateDoc(doc(db, "leads", inv.leadId), {
             totalPaid: increment(toPay)
         });
      }

      if (generatedInvoiceData && generatedInvoiceData.id === inv.id) {
         setGeneratedInvoiceData({
            ...generatedInvoiceData,
            amountPaid: newAmountPaid
         });
      }

      toast.success(full ? "Invoice marked as fully paid" : "Partial payment recorded");
      setPartialPaymentInvoice(null);
      setPartialPaymentAmount("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update payment");
    }
  };

  const handleExportCSV = () => {
    // Create CSV rows
    const rows = [
      ["Type", "Date", "Name/Desc", "Amount", "Category/Recurring"],
    ];
    // Add Invoices
    pastInvoices.forEach((inv) => {
      const d = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date();
      const scheduleStr = inv.parentInvoiceId
        ? "Auto-Generated"
        : inv.recurringSchedule && inv.recurringSchedule !== "none"
          ? `Recurring (${inv.recurringSchedule})`
          : inv.isRecurring
            ? "Recurring"
            : "One-Time";
      rows.push([
        "Invoice",
        format(d, "yyyy-MM-dd"),
        inv.desc || inv.invoiceNumber,
        inv.amount,
        scheduleStr,
      ]);
    });
    // Add Expenses
    expenses.forEach((exp) => {
      const d = exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date();
      rows.push([
        "Expense",
        format(d, "yyyy-MM-dd"),
        exp.name,
        `-${exp.amount}`,
        exp.category || "Other",
      ]);
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `financials_export_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const updateLivePreview = React.useCallback(() => {
    const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
    const inv = {
      invoiceNumber: getVal("standalone-invoice") || "INV-000",
      email: getVal("standalone-email"),
      clientName: getVal("standalone-clientName") || "Client Name",
      clientAddress: getVal("standalone-clientAddress") || "",
      amount: getVal("standalone-amount") || 0,
      amountPaid: getVal("standalone-amountPaid") || 0,
      desc: getVal("standalone-desc") || "Description",
      format: getVal("standalone-format"),
      revisions: getVal("standalone-revisions"),
      dueDate: getVal("standalone-dueDate"),
      terms: getVal("standalone-terms"),
      welcomeMessage: getVal("standalone-welcomeMessage"),
      taxRate: getVal("standalone-taxRate") ? Number(getVal("standalone-taxRate")) : 0,
      discount: getVal("standalone-discount") ? Number(getVal("standalone-discount")) : 0,
      senderName: getVal("standalone-senderName"),
      senderEmail: getVal("standalone-senderEmail"),
      senderAddress: getVal("standalone-senderAddress"),
      logoUrl: getVal("standalone-logoUrl"),
      additionalNotes: getVal("standalone-additionalNotes"),
      recurringSchedule: getVal("standalone-recurringSchedule") || "none",
      currency: getVal("standalone-currency") || "USD",
      brandColor: brandColor
    };
    setLivePreviewData(inv);
  }, [brandColor]);

  // Debounced wrapper to prevent React max update depth or excessive renders
  const livePreviewTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdateLivePreview = React.useCallback(() => {
    if (livePreviewTimeout.current) clearTimeout(livePreviewTimeout.current);
    livePreviewTimeout.current = setTimeout(updateLivePreview, 100);
  }, [updateLivePreview]);

  useEffect(() => {
    if (!user) return;

    // Fetch user settings for default template and auto-fill
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.defaultInvoiceTemplate) {
            setInvoiceTemplate(data.defaultInvoiceTemplate);
          }
          // Prefill sender data if empty
          setTimeout(() => {
            let changed = false;
            const sName = document.getElementById("standalone-senderName") as HTMLInputElement;
            if (sName && !sName.value && (data.portalAgencyName || data.displayName)) {
               sName.value = data.portalAgencyName || data.displayName || "";
               changed = true;
            }
            const sEmail = document.getElementById("standalone-senderEmail") as HTMLInputElement;
            if (sEmail && !sEmail.value && user.email) {
               sEmail.value = user.email || "";
               changed = true;
            }
            const sLogo = document.getElementById("standalone-logoUrl") as HTMLInputElement;
            if (sLogo && !sLogo.value && data.portalLogoUrl) {
               sLogo.value = data.portalLogoUrl || "";
               changed = true;
            }
            if (changed) debouncedUpdateLivePreview();
          }, 500); // slight delay to ensure dom is mounted
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();

    const q = query(collection(db, "leads"), where("ownerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLeads: any[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeads(fetchedLeads);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "leads");
      },
    );

    const expensesQ = query(
      collection(db, "expenses"),
      where("ownerId", "==", user.uid),
    );

    const unsubExpenses = onSnapshot(
      expensesQ,
      (snapshot) => {
        const fetchedExpenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(fetchedExpenses);

        let totalExp = 0;
        fetchedExpenses.forEach(
          (e: any) => (totalExp += Number(e.amount || 0)),
        );
        setTotalExpenses(totalExp);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "expenses");
      },
    );

    const invoicesQ = query(
      collection(db, "invoices"),
      where("ownerId", "==", user.uid),
    );

    const emailTemplatesQ = query(
      collection(db, "emailTemplates"),
      where("ownerId", "==", user.uid)
    );

    const unsubEmailTemplates = onSnapshot(emailTemplatesQ, (snapshot) => {
      setEmailTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "emailTemplates");
    });

    const customInvoiceTemplatesQ = query(
      collection(db, "customInvoiceTemplates"),
      where("ownerId", "==", user.uid)
    );
    const unsubCustomInvoiceTemplates = onSnapshot(customInvoiceTemplatesQ, (snapshot) => {
      setCustomInvoiceTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "customInvoiceTemplates");
    });

    const unsubInvoices = onSnapshot(
      invoicesQ,
      (snapshot) => {
        const fetchedInvoices = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchedInvoices.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis() || a.sentAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || b.sentAt?.toMillis() || 0;
          return bTime - aTime;
        });
        setPastInvoices(fetchedInvoices);

        let calculatedMrr = 0;
        fetchedInvoices.forEach((inv: any) => {
          if (
            inv.isRecurring &&
            inv.recurringSchedule &&
            inv.recurringSchedule !== "none"
          ) {
            const amt = Number(inv.amount || 0);
            if (inv.recurringSchedule === "weekly") calculatedMrr += amt * 4.33;
            else if (inv.recurringSchedule === "monthly") calculatedMrr += amt;
            else if (inv.recurringSchedule === "quarterly")
              calculatedMrr += amt / 3;
            else if (inv.recurringSchedule === "yearly")
              calculatedMrr += amt / 12;
          } else if (inv.isRecurring) {
            calculatedMrr += Number(inv.amount || 0); // fallback for legacy
          }
        });
        setMrr(calculatedMrr);

        const paidInvoices = fetchedInvoices.filter((inv: any) => inv.status === 'paid');
        let totalRev = 0;
        let mtdRev = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const revMap: Record<string, { recurring: number, oneoff: number }> = {};

        paidInvoices.forEach((inv: any) => {
          totalRev += Number(inv.amountPaid || inv.amount || 0);
          const date = inv.paidAt?.toDate ? inv.paidAt.toDate() : (inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date());
          if (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          ) {
            mtdRev += Number(inv.amountPaid || inv.amount || 0);
          }

          const monthKey = format(date, "MMM");
          if (!revMap[monthKey]) revMap[monthKey] = { recurring: 0, oneoff: 0 };
          
          if (inv.isRecurring && inv.recurringSchedule && inv.recurringSchedule !== 'none') {
             revMap[monthKey].recurring += Number(inv.amountPaid || inv.amount || 0);
          } else {
             revMap[monthKey].oneoff += Number(inv.amountPaid || inv.amount || 0);
          }
        });
        
        setTotalRevenue(totalRev);
        setMonthlyRevenue(mtdRev);

        const chartData: { month: string; recurring: number; oneoff: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthKey = format(d, "MMM");
          chartData.push({
            month: monthKey,
            recurring: revMap[monthKey]?.recurring || 0,
            oneoff: revMap[monthKey]?.oneoff || 0,
          });
        }
        setRevenueData(chartData);

        // Auto-generate due invoices
        if (!snapshot.metadata.hasPendingWrites) {
          const now = new Date();
          fetchedInvoices.forEach(async (inv: any) => {
            if (
              inv.isRecurring &&
              inv.recurringSchedule &&
              inv.recurringSchedule !== "none"
            ) {
              const lastGenDate = inv.lastGeneratedAt?.toDate
                ? inv.lastGeneratedAt.toDate()
                : inv.createdAt?.toDate
                  ? inv.createdAt.toDate()
                  : null;
              if (!lastGenDate) return;

              const nextDate = new Date(lastGenDate);
              if (inv.recurringSchedule === "weekly")
                nextDate.setDate(nextDate.getDate() + 7);
              else if (inv.recurringSchedule === "monthly")
                nextDate.setMonth(nextDate.getMonth() + 1);
              else if (inv.recurringSchedule === "quarterly")
                nextDate.setMonth(nextDate.getMonth() + 3);
              else if (inv.recurringSchedule === "yearly")
                nextDate.setFullYear(nextDate.getFullYear() + 1);

              if (now > nextDate) {
                // Generate a new instance of this invoice
                const newInvoicePayload = {
                  ...inv,
                  id: undefined,
                  isRecurring: false, // The instance is not the recurring definition
                  recurringSchedule: "none",
                  parentInvoiceId: inv.id,
                  invoiceNumber: `${inv.invoiceNumber}-${Math.floor(Math.random() * 10000)}`,
                  autoGenerated: true,
                  sentAt: serverTimestamp(),
                };
                delete newInvoicePayload.id;
                try {
                  await addDoc(collection(db, "invoices"), newInvoicePayload);
                  await updateDoc(doc(db, "invoices", inv.id), {
                    lastGeneratedAt: serverTimestamp(),
                  });
                } catch (err) {
                  console.error(
                    "Failed to auto-generate recurring invoice:",
                    err,
                  );
                }
              }
            }
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "invoices");
      },
    );

    return () => {
      unsubscribe();
      unsubExpenses();
      unsubInvoices();
      unsubEmailTemplates();
      unsubCustomInvoiceTemplates();
    };
  }, [user, debouncedUpdateLivePreview]);

  const activeContracts = leads
    .filter((l) => l.status === "negotiating" || l.status === "closed")
    .slice(0, 4);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pendingInvoices = leads
    .filter((l) => l.status === "contacted" || l.status === "negotiating")
    .slice(0, 4);

  return (
    <div className="flex-1 flex flex-col relative w-full bg-transparent">
      <header className="bg-[#000000]/60 backdrop-blur-[80px] saturate-[2.0] border-b border-white/[0.02] top-0 sticky z-40 flex justify-between items-center w-full px-8 py-5">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-black text-2xl text-zinc-100 font-body tracking-tight tracking-[0.02em] shadow-sm">BM</span>
          <h2 className="text-2xl font-body tracking-tight font-black text-zinc-100 tracking-[0.02em] uppercase drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] hidden lg:block">
            WAR ROOM | FINANCIAL COMMAND
          </h2>
        </div>
        <div className="flex items-center gap-10">
          <button
            onClick={handleExportCSV}
            className="hidden md:flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-100 border border-white/30 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-2xl transition-colors shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
          >
            <Download size={14} /> EXTRACT LOGS
          </button>
          <div className="flex items-center gap-2 text-white/60">
            <button className="p-2 hover:text-white rounded-2xl hover:bg-white/5 transition-colors">
              <Bell size={18} />
            </button>
            <button className="p-2 hover:text-white rounded-2xl hover:bg-white/5 transition-colors">
              <HelpCircle size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="p-10 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full mb-32">
        {/* Hero Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="glass-panel border-[#34C759]/20 rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#34C759]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet size={80} className="text-[#34C759]" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#34C759] mb-2 font-black drop-shadow-[0_4px_24px_rgba(52, 199, 89,0.15)]">
              THE WAR CHEST
            </p>
            <h3 className="text-3xl font-body tracking-tight font-semibold text-white tracking-tight">
              ${totalRevenue.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] text-[10px] font-semibold rounded-2xl flex items-center gap-1">
                <CheckCircle size={10} />
                Lifetime volume
              </span>
            </div>
          </div>

          <div className="glass-panel border-white/[0.04] rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3B30]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingDown size={80} className="text-[#FF3B30]" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#FF3B30] mb-2 font-black drop-shadow-[0_4px_24px_rgba(255, 59, 48,0.15)]">
              OPERATIONAL BLEED
            </p>
            <h3 className="text-3xl font-body tracking-tight font-semibold text-white tracking-tight">
              ${totalExpenses.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 bg-[#FF3B30]/10 border border-white/[0.04] text-[#FF453A] text-[10px] font-semibold rounded-2xl flex items-center gap-1">
                <TrendingDown size={10} />
                Cost of business
              </span>
            </div>
          </div>

          <div className="glass-panel border-[#34C759]/20 rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#34C759]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ArrowUp size={80} className="text-[#34C759]" />
            </div>
            <p className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#34C759] mb-2 font-black drop-shadow-[0_4px_24px_rgba(52, 199, 89,0.15)] relative z-10">
              PURE PROFIT
            </p>
            <h3 className="text-3xl font-body tracking-tight font-semibold text-white tracking-tight relative z-10">
              ${Math.max(0, totalRevenue - totalExpenses).toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className="px-2 py-1 bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] text-[10px] font-semibold rounded-2xl flex items-center gap-1">
                <ArrowUp size={10} />
                {totalRevenue > 0
                  ? `${(
                      (Math.max(0, totalRevenue - totalExpenses) /
                        totalRevenue) *
                      100
                    ).toFixed(1)}% Margin`
                  : "Net Value"}
              </span>
            </div>
          </div>

          <div className="glass-panel border-[#34C759]/20 rounded-2xl p-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#34C759]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#34C759] mb-2 font-black drop-shadow-[0_4px_24px_rgba(52, 199, 89,0.15)] relative z-10">
              GUARANTEED MRR
            </h3>
            <h3 className="text-3xl font-body tracking-tight font-black text-white tracking-tight relative z-10">
              ${mrr.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <span className="px-2 py-1 bg-[#34C759]/10 border border-[#34C759]/20 text-[#34C759] text-[10px] font-semibold rounded-2xl flex items-center gap-1">
                Recurring value
              </span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-10 flex flex-col justify-between border-white/20 relative overflow-hidden transform hover:scale-[1.02] transition-transform shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-body tracking-tight font-black mb-1 text-zinc-100 uppercase tracking-tight">
                DOMINATION QUOTA
              </h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-100/70 font-bold">
                MONTHLY EXTRACTION: $10,000
              </p>
            </div>
            <div className="mt-4 relative z-10">
              <div className="w-full bg-[#000000]/50 rounded-full h-2 overflow-hidden border border-white/[0.02]">
                <div
                  className="bg-[var(--brand-primary)] text-white h-full rounded-full transition-all shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]"
                  style={{
                    width: `${Math.min((monthlyRevenue / 10000) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] mt-3 font-bold opacity-80 font-mono text-zinc-100">
                <span>${monthlyRevenue.toLocaleString()}</span>
                <span>$10k</span>
               </div>
            </div>
          </div>
        </div>

        {/* Actual Historical Revenue Chart */}
        <section className="mb-8 glass-panel border border-white/[0.02] rounded-2xl p-10 relative overflow-hidden shadow-2xl">
           <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                 <h3 className="text-xl font-body tracking-tight font-black text-white flex items-center gap-3">
                   <BarChartIcon size={24} className="text-zinc-100" /> Historical Revenue
                 </h3>
                 <p className="text-white/60 font-mono text-sm mt-2">Your actual closed revenue over the last 6 months.</p>
              </div>
           </div>
           
           <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={revenueData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                   <XAxis dataKey="month" stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dy={10} />
                   <YAxis stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dx={-10} tickFormatter={(value) => `$${value.toLocaleString()}`} />
                   <Tooltip 
                     cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                     contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', padding: '12px' }}
                     itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                     labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}
                     formatter={(val: number) => `$${val.toLocaleString()}`}
                   />
                   <Bar dataKey="oneoff" stackId="a" fill="white" radius={[0, 0, 4, 4]} name="One-Off Revenue" />
                   <Bar dataKey="recurring" stackId="a" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} name="Recurring Revenue" />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </section>

        {/* Predictive MRR & Cashflow Forecast */}
        <section className="mb-8 glass-panel border border-white/[0.04] rounded-2xl p-10 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--brand-primary)]/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>
           <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                 <h3 className="text-xl font-body tracking-tight font-black text-white flex items-center gap-3">
                   <TrendingUp size={24} className="text-[var(--brand-primary)]" /> 12-Month Predictive Cashflow & Runway AI
                 </h3>
                 <p className="text-white/60 font-mono text-sm mt-2">Analyzes MRR, one-off project averages, and bleed to project your runway. Use this to time new hires or ad spend.</p>
              </div>
           </div>
           
           <div className="h-64 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 {(() => {
                    let cashPool = totalRevenue - totalExpenses;
                    if (cashPool < 0) cashPool = 0;
                    const monthlyBurn = totalExpenses > 0 ? (totalExpenses / 12) : 500; // rough 12m avg or fallback
                    const averageMonthlyNonMRR = (totalRevenue - (mrr * 12)) > 0 ? ((totalRevenue - (mrr * 12)) / 12) : 500; // rough guess
                    
                    const data = [];
                    let currentCash = cashPool;
                    for(let i=1; i<=12; i++) {
                       const d = new Date();
                       d.setMonth(d.getMonth() + i);
                       currentCash = currentCash + mrr + averageMonthlyNonMRR - monthlyBurn;
                       data.push({
                          month: d.toLocaleDateString(undefined, { month: 'short' }),
                          projectedCash: currentCash > 0 ? currentCash : 0,
                          burn: monthlyBurn
                       });
                    }
                    return (
                       <AreaChart data={data}>
                         <defs>
                           <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4}/>
                             <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                         <XAxis dataKey="month" stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dy={10} />
                         <YAxis stroke="none" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }} dx={-10} tickFormatter={(value) => `$${value}`} />
                         <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', padding: '12px' }}
                           itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                           labelStyle={{ color: '#71717a', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}
                         />
                         <Area type="monotone" dataKey="projectedCash" stroke="var(--brand-primary)" fill="url(#colorForecast)" strokeWidth={2} name="Projected Cash Reserve" />
                       </AreaChart>
                    );
                 })()}
              </ResponsiveContainer>
           </div>
           {(() => {
              const monthlyBurn = totalExpenses > 0 ? (totalExpenses / 12) : 500;
              const netMonthly = mrr + (((totalRevenue - (mrr * 12)) > 0 ? ((totalRevenue - (mrr * 12)) / 12) : 500)) - monthlyBurn;
              let runwayMsg;
              if (netMonthly >= 5000) {
                 runwayMsg = "Aggressive Scale Mode. You have enough surplus to confidently hire 1-2 junior editors or increase ad spend.";
              } else if (netMonthly >= 1000) {
                 runwayMsg = "Stable Growth. Focus on closing 2 more retainers before expanding overhead.";
              } else if (netMonthly > 0) {
                 runwayMsg = "Marginal Growth. Tidy up expenses and focus on upselling current clients to retainers.";
              } else {
                 runwayMsg = "Bleeding Cash. Reduce software subscriptions or non-essential contractors immediately.";
              }
              return (
                 <div className="mt-6 border-t border-white/[0.04] pt-6 flex items-start gap-4">
                    <div className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] p-2 rounded-xl mt-1"><TrendingUp size={20} /></div>
                    <div>
                       <h4 className="text-white font-bold text-sm">AI Recommendation</h4>
                       <p className="text-white/60 text-xs mt-1 leading-relaxed max-w-2xl">{runwayMsg}</p>
                    </div>
                 </div>
              );
           })()}
        </section>

         {/* Smart Retainer / Subscription Storefront */}
         <section className="mb-8 glass-panel border border-white/[0.04] rounded-2xl p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[var(--brand-primary)]/10 to-transparent blur-3xl rounded-full pointer-events-none"></div>
            <div className="flex justify-between items-end mb-8 relative z-10 w-full">
               <div>
                  <h3 className="text-xl font-body tracking-tight font-black text-white flex items-center gap-3">
                    <CreditCard size={24} className="text-[var(--brand-primary)]" /> Subscription & Retainer Packages
                  </h3>
                  <p className="text-white/60 font-mono text-sm mt-2">Scale MRR by sharing checkout links directly with clients from Stripe.</p>
               </div>
               <button onClick={() => window.open('https://dashboard.stripe.com/test/payment-links/create', '_blank')} className="bg-[var(--brand-primary)] text-black hover:bg-white text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-2.5 rounded-sm transition-all flex items-center gap-2">
                 <Sparkles size={14} /> New Package
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 w-full">
               {[
                 { title: 'Lite Editor', price: 2000, desc: '2 Videos / Month. Basic editing, no motion graphics.', cta: 'https://buy.stripe.com/test_1' },
                 { title: 'Pro Creator', price: 4500, desc: '4 Videos / Month. Advanced editing, animations & thumbnails.', cta: 'https://buy.stripe.com/test_2', popular: true },
                 { title: 'Scale Partner', price: 8000, desc: '8 Videos / Month. AI strategy, Hook scripting, unlimited revisions.', cta: 'https://buy.stripe.com/test_3' },
               ].map((pkg, i) => (
                  <div key={i} className={`bg-[#000000] border ${pkg.popular ? 'border-[var(--brand-primary)]/50 shadow-[0_0_30px_rgba(255,0,0,0.1)]' : 'border-white/[0.04]'} p-8 rounded-sm relative flex flex-col`}>
                     {pkg.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--brand-primary)] text-black text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-sm">Most Popular</div>}
                     <h4 className="text-white font-bold font-body text-xl mb-2">{pkg.title}</h4>
                     <p className="text-3xl font-black text-white mb-4">${pkg.price}<span className="text-sm text-white/50 font-normal">/mo</span></p>
                     <p className="text-sm text-white/60 mb-8 border-t border-white/[0.04] pt-4">{pkg.desc}</p>
                     <div className="mt-auto">
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(pkg.cta); toast.success('Payment link copied!'); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white transition-colors py-2 rounded-sm text-[10px] uppercase tracking-[0.2em] font-bold border border-white/[0.04] flex items-center justify-center gap-2">
                             <Copy size={12} /> Copy Link
                          </button>
                          <button onClick={() => window.open(pkg.cta, '_blank')} className="bg-white/10 hover:bg-white/20 text-white transition-colors p-2 rounded-sm border border-white/[0.04]">
                             <ArrowRight size={14} />
                          </button>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>

        
        {/* Split Screen Generator */}
        <section className="bg-[#141414] border border-[#222] rounded-2xl relative overflow-hidden flex flex-col xl:flex-row shadow-[0_4px_24px_rgba(255,255,255,0.15)] font-sans text-xs">
           <div className="w-full xl:w-[40%] flex-shrink-0 bg-[#161616] border-r border-[#222] overflow-y-auto max-h-[1000px] no-scrollbar">
              
              <div className="bg-[#1e1e1e] border-b border-[#222] p-2 flex items-center justify-between">
                <div className="flex space-x-1">
                  <div className="px-3 py-1 bg-[#2e2e2e] text-zinc-200 text-xs rounded-sm font-semibold tracking-wide border-t-2 border-t-[var(--brand-primary)]">Export Settings</div>
                  <div className="px-3 py-1 text-white/60 text-xs font-semibold tracking-wide">Video</div>
                  <div className="px-3 py-1 text-white/60 text-xs font-semibold tracking-wide">Audio</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-[#141414] border border-[#333] text-white/80 text-[10px] uppercase font-mono px-2 py-1 rounded-sm outline-none focus:border-white/20"
                    onChange={(e) => {
                      const leadId = e.target.value;
                      setSelectedLeadIdForInvoice(leadId || null);
                      if (!leadId) return;
                      const selectedLead = activeContracts.find(l => l.id === leadId);
                      if (selectedLead) {
                        const nameEl = document.getElementById("standalone-clientName") as HTMLInputElement;
                        const amtEl = document.getElementById("standalone-amount") as HTMLInputElement;
                        const emailEl = document.getElementById("standalone-email") as HTMLInputElement;
                        
                        if (nameEl) nameEl.value = selectedLead.brandName || selectedLead.contactName || "";
                        if (amtEl) amtEl.value = selectedLead.budget?.toString() || "";
                        if (emailEl) emailEl.value = selectedLead.email || "";
                        debouncedUpdateLivePreview();
                        toast.success("Autofilled from lead");
                      }
                    }}
                  >
                    <option value="">Preset: Custom</option>
                    {activeContracts.map(lead => (
                      <option key={lead.id} value={lead.id}>Load: {lead.brandName || lead.contactName || "Unnamed Lead"}</option>
                    ))}
                  </select>
                </div>
              </div>
              <form
                id="standalone-invoice-form"
                className="p-3 space-y-3"
                onChange={(e) => {
                  setIsStandaloneFormValid(e.currentTarget.checkValidity());
                  debouncedUpdateLivePreview();
                }}
                onSubmit={(e) => e.preventDefault()}
              >
                
                {/* Financial Group */}
                <div className="border border-[#2a2a2a] bg-[#000000] rounded-sm shadow-sm">
                  <div className="bg-[#222] px-3 py-1.5 border-b border-[#2a2a2a] flex items-center gap-2 font-semibold text-white/80 text-[10px] uppercase tracking-widest">
                     <span className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-[var(--brand-primary)] border-b-4 border-b-transparent"></span>
                     Financial Parameters
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px]">Invoice ID</label>
                      <input
                        required
                        type="text"
                        id="standalone-invoice"
                        className="w-32 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 text-right font-mono text-[10px]"
                        placeholder="INV-001"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px]">Total Value ($)</label>
                      <input
                        required
                        min="1"
                        type="number"
                        id="standalone-amount"
                        className="w-32 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-100 font-mono focus:outline-none focus:border-white/20 text-right text-[10px]"
                        placeholder="1000"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-between mt-1">
                      <div className="flex flex-col">
                        <label className="text-white/60 font-mono text-[10px]">Deposit Paid ($)</label>
                        <div className="flex gap-1 mt-1">
                          <button type="button" onClick={() => { const el = document.getElementById("standalone-amountPaid") as HTMLInputElement; if (el) { el.value = "0"; debouncedUpdateLivePreview(); }}} className="px-1.5 py-0.5 bg-[#222] hover:bg-[#333] text-[9px] rounded-sm text-white/60 font-mono border border-[#333]">0%</button>
                          <button type="button" onClick={() => { const amt = parseFloat((document.getElementById("standalone-amount") as HTMLInputElement).value || "0"); const el = document.getElementById("standalone-amountPaid") as HTMLInputElement; if (el) { el.value = (amt * 0.5).toFixed(2); debouncedUpdateLivePreview(); }}} className="px-1.5 py-0.5 bg-[#222] hover:bg-[#333] text-[9px] rounded-sm text-white/60 font-mono border border-[#333]">50%</button>
                          <button type="button" onClick={() => { const amt = (document.getElementById("standalone-amount") as HTMLInputElement).value || "0"; const el = document.getElementById("standalone-amountPaid") as HTMLInputElement; if (el) { el.value = amt; debouncedUpdateLivePreview(); }}} className="px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-[9px] rounded-sm text-zinc-100 font-mono border border-white/30">100%</button>
                        </div>
                      </div>
                      <input
                        type="number"
                        id="standalone-amountPaid"
                        className="w-32 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 font-mono focus:outline-none focus:border-white/20 text-right self-start text-[10px]"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px]">Description</label>
                      <input
                        required
                        type="text"
                        id="standalone-desc"
                        className="w-[60%] bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]"
                        placeholder="Project Summary"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Metadata Group */}
                <div className="border border-[#2a2a2a] bg-[#000000] rounded-sm shadow-sm">
                  <div className="bg-[#222] px-3 py-1.5 border-b border-[#2a2a2a] flex items-center gap-2 font-semibold text-white/80 text-[10px] uppercase tracking-widest">
                     <span className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-zinc-400 border-b-4 border-b-transparent"></span>
                     Client Metadata
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Client Name</label>
                      <input required type="text" id="standalone-clientName" className="w-2/3 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="Client Name" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Client Email</label>
                      <input type="email" id="standalone-email" className="w-2/3 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="client@example.com" />
                    </div>
                    <div className="flex items-start justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3 mt-1">Client Address</label>
                      <textarea id="standalone-clientAddress" rows={2} className="w-2/3 resize-none bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="Address"></textarea>
                    </div>
                  </div>
                </div>

                {/* Sender Metadata Group */}
                <div className="border border-[#2a2a2a] bg-[#000000] rounded-sm shadow-sm">
                  <div className="bg-[#222] px-3 py-1.5 border-b border-[#2a2a2a] flex items-center gap-2 font-semibold text-white/80 text-[10px] uppercase tracking-widest">
                     <span className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-zinc-400 border-b-4 border-b-transparent transition-transform transform rotate-90"></span>
                     Sender Details
                  </div>
                  <div className="p-3 grid grid-cols-1 gap-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Your Name</label>
                      <input type="text" id="standalone-senderName" className="w-2/3 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="Post House / Editor" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Your Email</label>
                      <input type="email" id="standalone-senderEmail" className="w-2/3 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="editor@example.com" />
                    </div>
                    <div className="flex items-start justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3 mt-1">Your Address</label>
                      <textarea id="standalone-senderAddress" rows={2} className="w-2/3 resize-none bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="Address"></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Brand Color</label>
                      <div className="flex gap-2 w-2/3">
                         <input type="color" value={getSafeColor(brandColor)} onChange={(e) => { e.stopPropagation(); setBrandColor(e.target.value); debouncedUpdateLivePreview(); }} className="h-[26px] w-8 bg-transparent border border-[#333] rounded-sm cursor-pointer shrink-0" />
                         <input type="text" id="standalone-brandColor" value={brandColor} onChange={(e) => { e.stopPropagation(); setBrandColor(e.target.value); debouncedUpdateLivePreview(); }} className="w-full bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px] uppercase" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-white/60 font-mono text-[10px] w-1/3">Logo URL</label>
                      <input type="url" id="standalone-logoUrl" className="w-2/3 bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="https://" />
                    </div>
                  </div>
                </div>

                {/* Project Specs Group */}
                <div className="border border-[#2a2a2a] bg-[#000000] rounded-sm shadow-sm">
                  <div className="bg-[#222] px-3 py-1.5 border-b border-[#2a2a2a] flex items-center gap-2 font-semibold text-zinc-100 text-[10px] uppercase tracking-widest">
                     <span className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-[var(--brand-primary)] border-b-4 border-b-transparent"></span>
                     Project Specs
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="col-span-2 sm:col-span-1 flex flex-col">
                      <label className="text-white/60 font-mono text-[10px] mb-1">Format & Length</label>
                      <input type="text" id="standalone-format" className="bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="10min 4K MP4" />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex flex-col">
                      <label className="text-white/60 font-mono text-[10px] mb-1">Revisions</label>
                      <input type="text" id="standalone-revisions" className="bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]" placeholder="2 Rounds" />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex flex-col">
                      <label className="text-white/60 font-mono text-[10px] mb-1">Due Date</label>
                      <input
                        type="text"
                        id="standalone-dueDate"
                        className="bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 font-mono text-[10px]"
                        placeholder="e.g. Net 15 / Upon receipt"
                      />
                    </div>
                  </div>
                </div>
                {/* Output Notes Group */}
                <div className="border border-[#2a2a2a] bg-[#000000] rounded-sm shadow-sm mt-3">
                  <div className="bg-[#222] px-3 py-1.5 border-b border-[#2a2a2a] flex items-center gap-2 font-semibold text-white/80 text-[10px] uppercase tracking-widest">
                     <span className="w-0 h-0 border-t-4 border-t-transparent border-l-4 border-l-zinc-400 border-b-4 border-b-transparent transition-transform transform rotate-90"></span>
                     Output Notes & Terms
                  </div>
                  <div className="p-3 space-y-3">
                     <div>
                       <label className="text-white/60 font-mono text-[10px] block mb-1">Director's Note</label>
                       <textarea id="standalone-welcomeMessage" rows={2} defaultValue="Thank you for choosing us for this project!" className="w-full resize-none bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 block font-mono text-[10px]"></textarea>
                     </div>
                     <div>
                       <label className="text-white/60 font-mono text-[10px] block mb-1">Terms</label>
                       <textarea id="standalone-terms" rows={3} defaultValue={"Payment is due within 30 days of the invoice date.\nLate payments are subject to a 1.5% monthly fee.\nPlease make checks payable to Junedit Design OR pay online via the attached links."} className="w-full resize-none bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 block font-mono text-[10px]"></textarea>
                     </div>
                     <div>
                       <label className="text-white/60 font-mono text-[10px] block mb-1">Footer Note</label>
                       <textarea id="standalone-additionalNotes" rows={2} defaultValue="We appreciate your business!" className="w-full resize-none bg-[#141414] border border-[#333] rounded-sm px-2 py-1 text-zinc-200 focus:outline-none focus:border-white/20 block font-mono text-[10px]"></textarea>
                     </div>
                  </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadModalOpen(true)}
                    className="w-full bg-[#111] hover:bg-[#222] text-[#eab308] px-4 py-2.5 rounded-sm font-bold uppercase tracking-[0.2em] transition-all border border-[#eab308] flex items-center justify-center gap-2 font-sans text-[11px]"
                  >
                    <FileText size={14} /> Generate Invoice
                  </button>
                  <button
                    disabled={generatingInvoice || !isStandaloneFormValid}
                    onClick={async () => {
                      const invoiceNumber = (
                        document.getElementById(
                          "standalone-invoice",
                        ) as HTMLInputElement
                      )?.value;
                      const email = (
                        document.getElementById(
                          "standalone-email",
                        ) as HTMLInputElement
                      )?.value;
                      const clientName = (
                        document.getElementById(
                          "standalone-clientName",
                        ) as HTMLInputElement
                      )?.value;
                      const clientAddress = (
                        document.getElementById(
                          "standalone-clientAddress",
                        ) as HTMLInputElement
                      )?.value;

                      const amount = (
                        document.getElementById(
                          "standalone-amount",
                        ) as HTMLInputElement
                      )?.value;
                      const amountPaid = (
                        document.getElementById(
                          "standalone-amountPaid",
                        ) as HTMLInputElement
                      )?.value;
                      const desc = (
                        document.getElementById(
                          "standalone-desc",
                        ) as HTMLInputElement
                      )?.value;
                      const format = (
                        document.getElementById(
                          "standalone-format",
                        ) as HTMLInputElement
                      )?.value;
                      const revisions = (
                        document.getElementById(
                          "standalone-revisions",
                        ) as HTMLInputElement
                      )?.value;
                      const dueDate = (
                        document.getElementById(
                          "standalone-dueDate",
                        ) as HTMLInputElement
                      )?.value;
                      const terms = (
                        document.getElementById(
                          "standalone-terms",
                        ) as HTMLInputElement
                      )?.value;
                      const taxRate = (
                        document.getElementById(
                          "standalone-taxRate",
                        ) as HTMLInputElement
                      )?.value;
                      const discount = (
                        document.getElementById(
                          "standalone-discount",
                        ) as HTMLInputElement
                      )?.value;
                      const senderName = (
                        document.getElementById(
                          "standalone-senderName",
                        ) as HTMLInputElement
                      )?.value;
                      const senderEmail = (
                        document.getElementById(
                          "standalone-senderEmail",
                        ) as HTMLInputElement
                      )?.value;
                      const senderAddress = (
                        document.getElementById(
                          "standalone-senderAddress",
                        ) as HTMLInputElement
                      )?.value;
                      const logoUrl = (
                        document.getElementById(
                          "standalone-logoUrl",
                        ) as HTMLInputElement
                      )?.value;
                      const additionalNotes = (
                        document.getElementById(
                          "standalone-additionalNotes",
                        ) as HTMLTextAreaElement
                      )?.value;
                      const recurringSchedule =
                        (
                          document.getElementById(
                            "standalone-recurringSchedule",
                          ) as HTMLSelectElement
                        )?.value || "none";
                      const isRecurring = recurringSchedule !== "none";
                      const currency =
                        (
                          document.getElementById(
                            "standalone-currency",
                          ) as HTMLSelectElement
                        )?.value || "USD";

                      if (!amount || !desc) {
                        alert("Please fill out Amount, and Short Description.");
                        return;
                      }
                      setGeneratingInvoice(true);
                      try {
                        const invoicePayload = {
                          invoiceNumber,
                          email,
                          amount,
                          amountPaid,
                          desc,
                          clientName,
                          clientAddress,
                          senderName,
                          senderEmail,
                          senderAddress,
                          logoUrl,
                          additionalNotes,
                          format,
                          revisions,
                          dueDate,
                          terms,
                          taxRate: taxRate ? Number(taxRate) : 0,
                          discount: discount ? Number(discount) : 0,
                          isRecurring,
                          recurringSchedule,
                          template: invoiceTemplate || "branded",
                          leadId: selectedLeadIdForInvoice,
                          currency,
                          ownerId: user?.uid,
                          sentAt: serverTimestamp(),
                          lastGeneratedAt: serverTimestamp(),
                        };

                        let finalId = "";
                        if (user) {
                          const existingQuery = query(
                            collection(db, "invoices"),
                            where("ownerId", "==", user.uid),
                            where("invoiceNumber", "==", invoiceNumber),
                          );
                          const existingDocs = await getDocs(existingQuery);
                          if (!existingDocs.empty) {
                            await updateDoc(
                              doc(db, "invoices", existingDocs.docs[0].id),
                              invoicePayload,
                            );
                            finalId = existingDocs.docs[0].id;
                          } else {
                            const newDoc = await addDoc(
                              collection(db, "invoices"),
                              invoicePayload,
                            );
                            finalId = newDoc.id;
                            if (invoicePayload.leadId) {
                               const { increment } = await import("firebase/firestore");
                               await updateDoc(doc(db, "leads", invoicePayload.leadId), {
                                  totalInvoiced: increment(Number(invoicePayload.amount) || 0)
                               });
                            }
                          }
                        }

                        setGeneratedInvoiceData({
                          ...invoicePayload,
                          id: finalId,
                        });
                      } catch (e) {
                        console.error(e);
                        alert("Failed to generate AI invoice");
                      } finally {
                        setGeneratingInvoice(false);
                      }
                    }}
                    className="w-full disabled:opacity-50 disabled:active:scale-100 bg-[#eab308] hover:bg-[#ca8a04] active:bg-[#a16207] text-[#111] px-4 py-2.5 rounded-sm font-bold uppercase tracking-[0.2em] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-black flex items-center justify-center gap-2 font-sans text-[11px]"
                  >
                    <ArrowRight size={14} />{" "}
                    {generatingInvoice ? "Rendering Sequence..." : "Export Form Data"}
                  </button>
                </div>
              </form>
           </div>
           <div className="w-full xl:w-[60%] bg-[#0f0f0f] border-t xl:border-t-0 xl:border-l border-[#222] overflow-y-auto max-h-[1000px]">
              {/* Split Screen Preview */}
              {(() => {
const previewData = generatedInvoiceData || livePreviewData || {};
const parsedAmount = Number(previewData?.amount || 0);
const parsedDiscount = Number(previewData?.discount || 0);
const parsedTaxRate = Number(previewData?.taxRate || 0);
const parsedAmountPaid = Number(previewData?.amountPaid || 0);
const computedSubtotal = Math.max(0, parsedAmount - parsedDiscount);
const computedTax = computedSubtotal * (parsedTaxRate / 100);
const computedTotalDue = computedSubtotal + computedTax;
const computedBalance = Math.max(0, computedTotalDue - parsedAmountPaid);
return (<AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full print:block"
                  >
                    <motion.div
                      initial={{ y: 50, opacity: 0, scale: 0.95 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: 20, opacity: 0, scale: 0.95 }}
                      className="bg-[#0f0f0f] h-full w-full flex flex-col overflow-hidden print:w-full print:h-auto print:max-h-none print:border-none print:shadow-none print:rounded-none"
                    >
                      <div className="flex justify-between items-center p-2 border-b border-[#222] print:hidden shrink-0 bg-[#1e1e1e]">
                        <div className="flex gap-2 items-center">
                           <div className="px-3 py-1 bg-[#2e2e2e] text-zinc-200 text-xs rounded-sm font-semibold tracking-wide border-t-2 border-t-blue-500">Preview Monitor</div>
                        </div>
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                          <span className="text-[10px] text-white/60 uppercase font-mono mr-2 hidden sm:block shrink-0">Format:</span>
                          {[
                            { id: "branded", label: "Director's" },
                            { id: "minimalist", label: "Timeline" },
                            { id: "detailed", label: "Studio" },
                            { id: "creative", label: "Cinematic" },
                            { id: "corporate", label: "Agency" },
                            { id: "callsheet", label: "Call Sheet" },
                            { id: "vhs", label: "VHS / CRT" },
                            { id: "receipt", label: "Receipt" },
                            { id: "storyboard", label: "Storyboard" },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={async () => {
                                setInvoiceTemplate(t.id as any);
                                if (previewData?.id) {
                                  try {
                                    await updateDoc(
                                      doc(db, "invoices", previewData.id),
                                      { template: t.id },
                                    );
                                    if (generatedInvoiceData && previewData.id === generatedInvoiceData.id) {
                                      setGeneratedInvoiceData({
                                        ...generatedInvoiceData,
                                        template: t.id,
                                      });
                                    }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
                                  } catch (err) {
                                    console.error("Failed to update invoice template");
                                  }
                                }
                              }}
                              className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-sm whitespace-nowrap transition-all border shrink-0 ${
                                invoiceTemplate === t.id
                                  ? "bg-[var(--brand-primary)] text-white border-white/[0.04] text-white shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]"
                                  : "bg-[#141414] border-[#333] text-white/60 hover:border-[#555] hover:text-white"
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                          <div className="w-px h-4 bg-[#333] mx-1 shrink-0"></div>
                          
                          <span className="text-[10px] text-white/60 uppercase font-mono mr-2 hidden sm:block shrink-0">Texture:</span>
                          {[
                            { id: "none", label: "Clean" },
                            { id: "grain", label: "Film Grain" },
                            { id: "dirty", label: "Dirty Lens" },
                            { id: "halftone", label: "Halftone" },
                          ].map((t) => (
                             <button
                               key={t.id}
                               onClick={() => setInvoiceTexture(t.id as any)}
                               className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-sm whitespace-nowrap transition-all border shrink-0 ${
                                 invoiceTexture === t.id
                                   ? "bg-[var(--brand-primary)] text-white border-white/[0.04] text-white shadow-[0_4px_24px_rgba(255, 59, 48,0.3)]"
                                   : "bg-[#141414] border-[#333] text-white/60 hover:border-[#555] hover:text-white"
                               }`}
                             >
                               {t.label}
                             </button>
                          ))}
                          <button
                            onClick={async () => {
                              const element = document.getElementById("invoice-print-area");
                              if (!element) return;
                              
                              setIsGeneratingPdf(true);
                              try {
                                const html2pdf = (await import('html2pdf.js')).default;
                                const opt: any = {
                                  margin:       [0.5, 0.5, 0.5, 0.5] as any,
                                  filename:     `Invoice-${livePreviewData?.invoiceNumber || 'draft'}.pdf`,
                                  image:        { type: 'jpeg' as const, quality: 1 },
                                  html2canvas:  { scale: 2, useCORS: true },
                                  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
                                };
                                
                                html2pdf().set(opt).from(element).outputPdf('bloburl').then(function (pdfUrl: string) {
                                  setPdfPreviewUrl(pdfUrl);
                                }).catch((e: any) => {
                                  console.error('Error in outputPdf', e);
                                  window.print();
                                });
                              } catch (e) {
                                console.error('Error generating PDF', e);
                                window.print();
                              } finally {
                                setIsGeneratingPdf(false);
                              }
                            }}
                            disabled={isGeneratingPdf}
                            className={`bg-[#141414] hover:bg-zinc-700 text-white font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 whitespace-nowrap ${isGeneratingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'Preview PDF'}</span><span className="sm:hidden">PDF</span>
                          </button>
                          
                          <button
                            onClick={async () => {
                              const element = document.getElementById("invoice-print-area");
                              if (!element) return;
                              
                              const oldTransform = element.style.transform;
                              element.style.transform = "none";
                              
                              try {
                                const canvas = await html2canvas(element, { scale: 3, useCORS: true, logging: false });
                                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                                const pdf = new jsPDF('p', 'mm', 'a4');
                                const pdfWidth = pdf.internal.pageSize.getWidth();
                                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                                pdf.save(`Invoice-${livePreviewData?.invoiceNumber || 'draft'}.pdf`);
                              } catch (error) {
                                console.error('Error downloading PDF', error);
                                toast.error("Failed to generate PDF download");
                              } finally {
                                element.style.transform = oldTransform;
                              }
                            }}
                            className={`bg-[#FF3B30] text-black hover:bg-[#FF453A] text-white font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] hover:shadow-[0_8px_32px_rgba(255,255,255,0.25)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap`}
                          >
                            <Download size={14} />
                            <span className="hidden sm:inline">Download PDF</span>
                            <span className="sm:hidden">Save</span>
                          </button>
                          {Number(previewData.amountPaid || 0) <
                            Number(previewData.amount) && (
                            <button
                              onClick={async () => {
                                if (generatedInvoiceData.id) {
                                  try {
                                    await updateDoc(
                                      doc(
                                        db,
                                        "invoices",
                                        generatedInvoiceData.id,
                                      ),
                                      {
                                        amountPaid: previewData.amount,
                                      },
                                    );
                                    if (generatedInvoiceData.leadId) {
                                      const { increment } = await import("firebase/firestore");
                                      await updateDoc(doc(db, "leads", generatedInvoiceData.leadId), {
                                        totalPaid: increment(Number(previewData.amount) || 0)
                                      });
                                    }
                                    setGeneratedInvoiceData({
                                      ...generatedInvoiceData,
                                      amountPaid: previewData.amount,
                                    });
                                    toast.success("Invoice marked as paid");
                                  } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to mark as paid");
                                  }
                                }
                              }}
                              className="bg-white/20 hover:bg-white/30 text-white/80 font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 whitespace-nowrap"
                            >
                              <CheckCircle size={14} />
                              <span className="hidden sm:inline">
                                Mark Paid
                              </span>
                              <span className="sm:hidden">Paid</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEmailModalOpen(true);
                              setEmailSubject(`Invoice ${previewData.invoiceNumber} from ${previewData.senderName || "JUNEDIT"}`);
                              setEmailBody(`Hi ${previewData.clientName || 'Valued Client'},\n\nPlease find your latest invoice (${previewData.invoiceNumber}) for ${getCurrencySymbol(previewData?.currency)}${Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})} attached.\n\nThank you,\n${previewData.senderName || "JUNEDIT"}`);
                            }}
                            className="bg-[var(--brandColor)] hover:bg-zinc-200 text-black text-white font-bold uppercase tracking-widest text-xs px-4 py-2.5 rounded-2xl transition-colors flex items-center gap-2 shadow-lg shadow-[var(--brandColor)]/20 whitespace-nowrap"
                          >
                            <span className="hidden sm:inline">
                              Send via Email
                            </span>
                            <span className="sm:hidden">Email</span>
                          </button>
                          <div className="w-px h-6 bg-zinc-700 mx-1 hidden sm:block"></div>
                          <button
                            onClick={() => {
                              setGeneratedInvoiceData(null);
                              (
                                document.getElementById(
                                  "standalone-invoice-form",
                                ) as HTMLFormElement
                              )?.reset();
                              setIsStandaloneFormValid(false);
                            }}
                            className="p-2 text-white/60 hover:text-white transition-colors bg-[#141414] rounded-2xl hover:bg-zinc-700 flex-shrink-0"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="p-10 md:p-12 overflow-y-auto no-scrollbar print:p-0 print:overflow-visible flex-grow">
                        <div
                          id="invoice-print-area"
                          style={{ '--brandColor': getSafeColor(previewData?.brandColor || brandColor || '#ea0000') } as any}
                          className={`w-full max-w-3xl mx-auto rounded-2xl font-sans relative overflow-hidden flex flex-col min-h-[800px] border shadow-2xl print:border-none print:shadow-none print:p-0 break-words ${
                            invoiceTemplate === "branded" ? "bg-[#0a0a0a] text-zinc-200 border-white/[0.04] print:bg-white print:text-black" : 
                            invoiceTemplate === "minimalist" ? "bg-white text-zinc-900 border-zinc-200" : 
                            invoiceTemplate === "detailed" ? "bg-zinc-50 text-zinc-800 border-zinc-200 print:bg-white" : 
                            invoiceTemplate === "corporate" ? "bg-white text-slate-800 border-slate-200" : 
                            invoiceTemplate === "vhs" ? "bg-white/5 text-white border-blue-950 font-mono" :
                            invoiceTemplate === "receipt" ? "bg-[#f4f4f4] text-black border-zinc-300 font-mono" :
                            invoiceTemplate === "storyboard" ? "bg-[var(--brand-primary)] text-white border-2 border-black" :
                            "bg-[#fdfbf7] text-stone-800 border-orange-100"
                          }`}
                        >
                          {invoiceTexture === "grain" && (
                             <div className="absolute inset-0 opacity-10 pointer-events-none z-50 print:hidden mix-blend-difference" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
                          )}
                          {invoiceTexture === "dirty" && (
                             <div className="absolute inset-0 opacity-20 pointer-events-none z-50 print:hidden mix-blend-overlay" style={{ background: "radial-gradient(circle at 20% 30%, rgba(200,180,150,0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(100,80,60,0.15) 0%, transparent 50%), url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.02%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.2%22/%3E%3C/svg%3E')", filter: "contrast(1.2)" }}></div>
                          )}
                          {invoiceTexture === "halftone" && (
                             <div className="absolute inset-0 opacity-5 pointer-events-none z-50 print:hidden mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at center, black 1px, transparent 1px)", backgroundSize: "4px 4px" }}></div>
                          )}
                          <style>{`
                            #invoice-print-area {
                              --brandColor: ${getSafeColor(previewData?.brandColor || brandColor || '#ea0000')} !important;
                            }
                            #invoice-print-area * {
                              -webkit-print-color-adjust: exact !important;
                              print-color-adjust: exact !important;
                            }
                          `}</style>
                          {/* Paid Status Badge */}
                          {computedTotalDue > 0 && Number(previewData.amountPaid) > 0 && Number(previewData.amountPaid) >= computedTotalDue && (
                            <div className="absolute top-10 right-8 md:top-12 md:right-12 pointer-events-none select-none z-[100] flex justify-center items-center print:top-10 print:right-6">
                              <div className="border-4 bg-emerald-50/90 backdrop-blur-md border-white/[0.04] text-white/80 px-4 py-2 md:px-6 md:py-3 rounded-2xl text-xl md:text-3xl font-black tracking-[0.2em] uppercase inline-flex items-center gap-3 font-sans shadow-2xl rotate-[12deg]">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                PAID
                              </div>
                            </div>
                          )}

                          {invoiceTemplate === "branded" && (
                            <div className="flex flex-col flex-1 bg-[#100e0b] text-[#f4e8d8] overflow-hidden relative print:bg-white print:text-black font-mono">
                              {/* Film Grain Texture layer */}
                              <div className="absolute inset-0 mix-blend-screen opacity-10 pointer-events-none print:hidden" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

                              {/* Left Perforations */}
                              <div className="absolute left-0 top-0 bottom-0 w-12 md:w-16 bg-[#0a0806] border-r-2 border-[#1c140e] flex flex-col py-6 px-3 z-10 print:hidden shadow-[inset_-6px_0_15px_rgba(0,0,0,0.8)] overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                  <div key={`l-${i}`} className="w-full aspect-[1/1.2] bg-[#fbf5ee] rounded-sm mb-5 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),0_0_2px_rgba(255,255,255,0.2)] opacity-90"></div>
                                ))}
                              </div>
                              
                              {/* Right Perforations */}
                              <div className="absolute right-0 top-0 bottom-0 w-12 md:w-16 bg-[#0a0806] border-l-2 border-[#1c140e] flex flex-col py-6 px-3 z-10 print:hidden shadow-[inset_6px_0_15px_rgba(0,0,0,0.8)] overflow-hidden">
                                {[...Array(30)].map((_, i) => (
                                  <div key={`r-${i}`} className="w-full aspect-[1/1.2] bg-[#fbf5ee] rounded-sm mb-5 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7),0_0_2px_rgba(255,255,255,0.2)] opacity-90"></div>
                                ))}
                              </div>

                              <div className="flex-1 ml-12 md:ml-16 mr-12 md:mr-16 p-10 md:p-14 relative flex flex-col z-0">
                                {/* Film Edge Markings */}
                                <div className="absolute top-0 left-6 md:left-10 right-6 md:right-10 flex justify-between text-[7px] md:text-[9px] text-[#eab308]/60 tracking-[0.4em] font-black py-3 border-b-2 border-[#eab308]/10 print:hidden">
                                  <span>KODAK VISION3 500T 5219</span>
                                  <span className="hidden md:inline">ROLL {previewData?.id?.substring(0,6) || "INV001"}</span>
                                  <span>FRAME 24A</span>
                                </div>
                                <div className="absolute bottom-0 left-6 md:left-10 right-6 md:right-10 flex justify-between text-[7px] md:text-[9px] text-[#eab308]/60 tracking-[0.4em] font-black py-3 border-t-2 border-[#eab308]/10 print:hidden">
                                  <span>35MM NEGATIVE</span>
                                  <span className="hidden md:inline">SYNC 01:00:00:00</span>
                                  <span>EASTMAN KODAK CO</span>
                                </div>

                                <div className="mt-10 mb-14 flex flex-col items-center text-center relative z-10">
                                  {previewData.logoUrl ? (
                                    <div className="mb-8 relative inline-block group">
                                      <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      <img src={previewData.logoUrl} alt="Logo" className="h-20 object-contain drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] grayscale sepia group-hover:sepia-0 group-hover:grayscale-0 transition-all duration-700 print:sepia-0 print:grayscale-0" />
                                    </div>
                                  ) : (
                                    <h1 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-white/5 py-2 px-4 -mx-4 font-black text-3xl md:text-5xl tracking-[0.3em] uppercase text-[#f4e8d8] print:text-black drop-shadow-md mb-6" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT STUDIO"}
                                    </h1>
                                  )}
                                  <div className="flex flex-col items-center gap-1.5 text-xs md:text-sm text-[#eab308]/80 font-bold tracking-[0.2em]">
                                      <span onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-sm transition-colors" title="Click to edit">{previewData.senderEmail || 'HELLO@JUNEDIT.COM'}</span>
                                      {previewData.senderAddress && (
                                        <span onClick={() => document.getElementById('standalone-senderAddress')?.focus()} className="cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded-sm transition-colors" title="Click to edit">{previewData.senderAddress}</span>
                                      )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14 border-y border-[#eab308]/20 py-10 relative">
                                  {/* Splice Tape Graphic */}
                                  <div className="absolute top-0 left-[15%] w-10 h-32 bg-white/5 -translate-y-1/2 rotate-12 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] print:hidden hidden md:block"></div>
                                  <div className="absolute bottom-0 right-[15%] w-10 h-32 bg-white/5 translate-y-1/2 -rotate-12 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)] print:hidden hidden md:block"></div>
                                  
                                  <div className="text-center md:text-left md:col-span-1 border-b md:border-b-0 md:border-r border-[#eab308]/20 pb-8 md:pb-0 relative z-10 flex flex-col justify-center">
                                    <p className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-4 font-black">Production / Client</p>
                                    <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-white/5 p-1 -m-1 text-2xl font-black uppercase text-white print:text-black mb-3 tracking-wide" title="Click to edit">
                                      {previewData.clientName || "Valued Client"}
                                    </p>
                                    <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-white/5 p-1 -m-1 text-xs text-[#a89886] mb-1 font-medium tracking-wide" title="Click to edit">
                                      {previewData.email}
                                    </p>
                                    {previewData.clientAddress && (
                                       <p onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-white/5 p-1 -m-1 text-xs text-[#a89886] whitespace-pre-wrap font-medium" title="Click to edit">
                                          {previewData.clientAddress}
                                       </p>
                                    )}
                                  </div>
                                  
                                  <div className="text-center md:col-span-1 flex flex-col justify-center items-center pb-8 md:pb-0 border-b md:border-b-0 md:border-r border-[#eab308]/20 relative z-10">
                                     <div className="w-full flex justify-between px-4 md:px-6 mb-6">
                                        <div className="text-center w-1/2">
                                           <div className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-2 font-black">Issue Date</div>
                                           <div className="font-bold text-xs text-[#f4e8d8] tracking-[0.2em]">{formatInvoiceDate(previewData.date || previewData.createdAt).toUpperCase()}</div>
                                        </div>
                                        <div className="text-center w-1/2">
                                           <div className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-2 font-black">Due Date</div>
                                           <div onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:bg-white/5 p-1 -m-1 font-bold text-xs text-[#eab308] tracking-[0.2em]" title="Click to edit">{previewData.dueDate || "UPON RECEIPT"}</div>
                                        </div>
                                     </div>
                                     <div className="text-center border border-[#eab308]/20 px-6 py-3 bg-[#eab308]/5">
                                        <div className="text-[9px] text-[#eab308] uppercase tracking-[0.3em] mb-2 font-black">INVOICE NO.</div>
                                        <div onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-white/5 px-2 py-0.5 text-2xl font-black tabular-nums tracking-[0.2em] text-white drop-shadow-md" title="Click to edit">
                                          {previewData.invoiceNumber}
                                        </div>
                                     </div>
                                  </div>

                                  <div className="text-center md:text-right md:col-span-1 flex flex-col justify-center items-center md:items-end relative z-10">
                                      <p className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-3 font-black">Total Due</p>
                                      <p className="text-5xl font-black text-[#f4e8d8] tabular-nums tracking-[0.02em] drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]">
                                        {getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                  </div>
                                </div>

                                {previewData.welcomeMessage && (
                                  <div className="mb-14 w-full flex justify-center relative z-20">
                                    <div className="w-full max-w-2xl bg-[#eab308] text-black p-5 font-bold text-center uppercase tracking-[0.2em] text-xs relative transform rotate-1 shadow-[4px_4px_15px_rgba(0,0,0,0.5)]">
                                      <div className="absolute top-1/2 -left-2 w-4 h-4 bg-[#100e0b] rounded-full -translate-y-1/2 print:hidden shadow-inner"></div>
                                      <div className="absolute top-1/2 -right-2 w-4 h-4 bg-[#100e0b] rounded-full -translate-y-1/2 print:hidden shadow-inner"></div>
                                      <p className="text-[8px] text-black/50 mb-2 tracking-[0.4em] font-black">DIRECTOR'S NOTE</p>
                                      <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-[#000000]/10 p-2 -m-2 whitespace-pre-wrap leading-relaxed" title="Click to edit">
                                        {previewData.welcomeMessage}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex-grow flex flex-col mb-14 relative z-10">
                                  <div className="flex text-[9px] text-[#eab308]/70 uppercase tracking-[0.4em] border-b border-[#eab308]/30 pb-3 mb-8 font-black">
                                    <div className="w-2/3 md:w-3/4 px-2">Scope of Work</div>
                                    <div className="w-1/3 md:w-1/4 text-right px-2">Amount</div>
                                  </div>
                                  
                                  <div className="flex flex-col md:flex-row items-start font-medium text-[#f4e8d8] print:text-black">
                                    <div className="w-full md:w-3/4 pr-0 md:pr-10 mb-6 md:mb-0 px-2">
                                      <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-white/5 p-2 -m-2 font-bold text-lg md:text-xl tracking-wide mb-6 whitespace-pre-wrap uppercase leading-loose" title="Click to edit">
                                        {previewData.desc}
                                      </div>
                                      <div className="flex flex-wrap gap-4">
                                        {previewData.format && (
                                          <div className="bg-[#15110d] border border-[#eab308]/20 px-4 py-1.5 flex items-center gap-3 print:bg-white print:border-black rounded-sm">
                                            <span className="text-[8px] text-[#eab308] uppercase tracking-[0.3em] font-black">FMT</span>
                                            <span className="text-xs font-bold tracking-[0.2em]">{previewData.format}</span>
                                          </div>
                                        )}
                                        {previewData.revisions && (
                                          <div className="bg-[#15110d] border border-[#eab308]/20 px-4 py-1.5 flex items-center gap-3 print:bg-white print:border-black rounded-sm">
                                            <span className="text-[8px] text-[#eab308] uppercase tracking-[0.3em] font-black">REV</span>
                                            <span className="text-xs font-bold tracking-[0.2em]">{previewData.revisions}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full md:w-1/4 text-left md:text-right font-black text-3xl tabular-nums tracking-[0.02em] px-2">
                                      <div className="md:hidden text-[9px] text-[#eab308]/70 uppercase tracking-[0.4em] mb-2 font-black">Amount</div>
                                      {getCurrencySymbol(previewData?.currency)}<span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:bg-white/5 p-1 -m-1" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-auto grid grid-cols-1 lg:grid-cols-3 gap-10 border-t border-[#eab308]/30 pt-10 relative z-10">
                                  {/* Film splice graphic */}
                                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#100e0b] text-[#eab308]/40 text-xs tracking-[1em] px-6 font-black print:hidden select-none pointer-events-none">
                                     [SPLICE]
                                  </div>

                                  <div className="lg:col-span-2 flex flex-col gap-10">
                                    {previewData.terms && (
                                      <div>
                                        <p className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-3 font-black">Terms</p>
                                        <div onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:bg-white/5 p-3 -m-3 text-xs text-[#a89886] uppercase leading-loose whitespace-pre-wrap border-l-2 border-[#eab308]/20 pl-4 font-medium tracking-wide" title="Click to edit">
                                          {previewData.terms}
                                        </div>
                                       </div>
                                    )}
                                    {previewData.additionalNotes && (
                                      <div>
                                        <p className="text-[9px] text-[#eab308]/70 uppercase tracking-[0.3em] mb-3 font-black">Notes</p>
                                        <div onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:bg-white/5 p-3 -m-3 text-xs text-[#a89886] uppercase leading-loose whitespace-pre-wrap border-l-2 border-[#eab308]/20 pl-4 font-medium tracking-wide" title="Click to edit">
                                          {previewData.additionalNotes}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="lg:col-span-1 bg-[#15110d] border border-[#eab308]/20 p-10 flex flex-col justify-end print:bg-white print:border-black font-black uppercase rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] print:shadow-none">
                                    <div className="space-y-4 mb-8 text-xs tracking-[0.2em] text-[#a89886]">
                                      <div className="flex justify-between border-b border-white/[0.02] pb-2">
                                        <span>SUB</span>
                                        <span className="text-[#f4e8d8]">{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                      {Number(previewData.discount || 0) > 0 && (
                                        <div className="flex justify-between text-white/80 border-b border-white/[0.02] pb-2">
                                          <span>DISC</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                      {Number(previewData.taxRate || 0) > 0 && (
                                        <div className="flex justify-between border-b border-white/[0.02] pb-2">
                                          <span>TAX ({previewData.taxRate}%)</span>
                                          <span className="text-[#f4e8d8]">{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                      {Number(previewData.amountPaid || 0) > 0 && (
                                        <div className="flex justify-between text-[#34C759] border-b border-white/[0.02] pb-2 text-sm">
                                          <span>PAID</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-8 border-t-2 border-[#eab308]/50 flex flex-col gap-4">
                                      {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                        <div className="flex flex-col gap-3 w-full mt-2 print:hidden">
                                          <div className="text-[9px] text-[#eab308] tracking-[0.3em] mb-2 text-center">REMITTANCE LINK:</div>
                                          {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                            <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="w-full bg-[#eab308] hover:bg-[var(--brand-primary)] text-white text-center py-3.5 px-6 text-xs transition-colors shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] tracking-[0.2em] rounded-sm">
                                              STRIPE PAY
                                            </a>
                                          )}
                                          {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                            <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="w-full bg-white/5 hover:bg-white/10 text-[#f4e8d8] text-center py-3.5 px-6 text-xs transition-colors border border-[#eab308]/20 tracking-[0.2em] rounded-sm">
                                              PAYPAL
                                            </a>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="mt-2 print:hidden w-full">
                                          <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="block w-full bg-[#eab308] hover:bg-[var(--brand-primary)] text-white text-center font-black py-4 px-6 text-xs tracking-[0.3em] transition-colors shadow-[0_4px_24px_rgba(255, 59, 48,0.3)] rounded-sm">
                                            CONTACT TO PAY
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {invoiceTemplate === "minimalist" && (
                            <div className="flex flex-col flex-1 bg-[#1e1e1e] text-white/80 overflow-hidden relative print:bg-white print:text-black font-sans text-sm border-2 border-black">
                              {/* Top Menu Bar */}
                              <div className="h-7 w-full bg-[#323232] border-b border-black flex items-center px-4 font-mono text-[10px] gap-4 print:hidden">
                                <div className="text-zinc-100 font-bold">File</div>
                                <div>Edit</div>
                                <div>Workspace</div>
                                <div>Timeline</div>
                                <div className="ml-auto text-white/60">Invoice Pro CC 2026</div>
                              </div>
                              
                              <div className="flex-grow flex flex-col md:flex-row p-1 gap-1">
                                {/* Left Panel (Project/Effect Controls) */}
                                <div className="w-full md:w-1/3 flex flex-col gap-1">
                                  <div className="bg-[#252525] flex-grow border border-black rounded-sm flex flex-col">
                                    <div className="h-6 bg-[#323232] border-b border-black flex items-center px-3 font-bold text-[10px] text-white/80">
                                      Project: INVOICE_{previewData.invoiceNumber}
                                    </div>
                                    <div className="p-4 flex flex-col h-full font-mono text-xs">
                                      <div className="mb-6">
                                        <p className="text-white/60 uppercase tracking-[0.2em] text-[10px] mb-1">Target // Client</p>
                                        <p onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 font-bold text-white text-lg break-words" title="Click to edit">
                                          {previewData.clientName || "Valued Client"}
                                        </p>
                                        <p onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-white/60 mt-1" title="Click to edit">
                                          {previewData.email}
                                        </p>
                                        {previewData.clientAddress && (
                                          <p onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-white/60 mt-1 whitespace-pre-wrap" title="Click to edit">
                                            {previewData.clientAddress}
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div className="mb-6 border-l-2 border-white/[0.04] pl-3">
                                        <p className="text-white/60 uppercase tracking-[0.2em] text-[10px] mb-1">Render Metadata</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          <span className="text-white/60">FORMAT:</span>
                                          <span className="text-white/80 text-right">{previewData.format || "ProRes 4444"}</span>
                                          <span className="text-white/60">REVISIONS:</span>
                                          <span className="text-white/80 text-right">{previewData.revisions || "2"}</span>
                                          <span className="text-white/60">DATE:</span>
                                          <span className="text-white/80 text-right">{formatInvoiceDate(previewData.date || previewData.createdAt)}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-auto bg-[#000000] p-3 rounded border border-[#323232]">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-white/60 text-[10px] uppercase">Amount Due</span>
                                          <span className="text-[10px] text-white/60 uppercase">Due: {previewData.dueDate || "Receipt"}</span>
                                        </div>
                                        <div className="text-2xl font-black text-[#5ba2d7] text-right tabular-nums">
                                          {getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Right Panel (Program Monitor & Timeline) */}
                                <div className="w-full md:w-2/3 flex flex-col gap-1">
                                  {/* Program Monitor */}
                                  <div className="bg-[#000000] h-48 md:h-64 border border-black rounded-sm flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 left-0 h-6 bg-[#323232] border-b border-black flex items-center px-3 font-bold text-[10px] text-white/80 z-10">
                                      Program: SEQUENCE 01
                                    </div>
                                    {previewData.logoUrl ? (
                                      <img src={previewData.logoUrl} alt="Logo" className="max-h-32 object-contain opacity-50 mix-blend-screen" />
                                    ) : (
                                       <h2 className="text-4xl font-black tracking-[0.02em] text-zinc-700 uppercase bg-clip-text text-transparent bg-gradient-to-b from-zinc-600 to-zinc-800">
                                         {previewData.senderName || "JUNEDIT"}
                                       </h2>
                                    )}
                                    <div className="absolute bottom-2 left-4 text-[#5ba2d7] font-mono text-xs opacity-70">
                                      {previewData.desc?.[0] || 'V'} 00:00:14:23
                                    </div>
                                  </div>
                                  
                                  {/* Timeline Panel */}
                                  <div className="bg-[#252525] flex-grow border border-black rounded-sm flex flex-col relative overflow-hidden">
                                     <div className="h-6 bg-[#323232] border-b border-black flex items-center px-3 font-bold text-[10px] text-white/80">
                                      Timeline: SEQUENCE 01 *
                                    </div>
                                    {/* Timeline Ruler */}
                                    <div className="h-6 border-b border-black bg-[#2a2a2a] flex items-end px-2 overflow-hidden sticky top-0 z-20">
                                       <div className="absolute left-[30%] top-0 bottom-0 w-px bg-[#FF3B30] z-30">
                                         <div className="absolute top-0 left-[-4px] w-[9px] h-3 bg-[#FF3B30] rounded-b-sm"></div>
                                       </div>
                                       {[...Array(20)].map((_, i) => (
                                         <div key={i} className="flex-1 border-l border-[#444] h-2 text-[8px] text-[#777] pl-1 font-mono">00:0{i}:00</div>
                                       ))}
                                    </div>
                                    
                                    {/* Timeline Tracks */}
                                    <div className="flex-grow flex flex-col font-mono relative">
                                       {/* Playhead line down */}
                                       <div className="absolute left-[30%] top-0 bottom-0 w-px bg-[#FF3B30]/50 z-10 pointer-events-none"></div>
                                       
                                       <div className="flex flex-1 min-h-[60px] border-b border-black group">
                                         <div className="w-16 bg-[#323232] border-r border-black flex items-center justify-center text-[10px] text-white/60 font-bold shrink-0">V1</div>
                                         <div className="flex-1 bg-[#1e1e1e] p-1 relative flex items-center">
                                            <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="absolute left-4 right-12 top-2 bottom-2 bg-[#5ba2d7] border border-[#7dbcf4] rounded-sm flex items-center px-3 cursor-pointer hover:brightness-110 shadow-lg" title="Click to edit">
                                              <span className="text-black text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis mr-4">
                                                {previewData.desc || 'Video Production Services'}
                                              </span>
                                              <span className="ml-auto text-black text-xs font-bold tabular-nums">
                                                {getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                              </span>
                                            </div>
                                         </div>
                                       </div>
                                       
                                       <div className="flex flex-1 min-h-[60px] border-b border-black group">
                                         <div className="w-16 bg-[#323232] border-r border-black flex items-center justify-center text-[10px] text-white/60 font-bold shrink-0">V2</div>
                                         <div className="flex-1 bg-[#1e1e1e] p-1 relative flex items-center">
                                            {Number(previewData.discount) > 0 && (
                                              <div className="absolute left-8 right-32 top-2 bottom-2 bg-[#d75b5b] border border-[#f47d7d] rounded-sm flex items-center px-3 opacity-90">
                                                <span className="text-black text-[10px] font-semibold">Discount Applied</span>
                                                <span className="ml-auto text-black text-[10px] font-bold tabular-nums">-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                              </div>
                                            )}
                                         </div>
                                       </div>
                                       
                                       <div className="flex flex-1 min-h-[60px] group">
                                         <div className="w-16 bg-[#323232] border-r border-black flex items-center justify-center text-[10px] text-white/60 font-bold shrink-0">A1</div>
                                         <div className="flex-1 bg-[#1e1e1e] p-1 relative flex items-center">
                                           {previewData.terms && (
                                              <div className="absolute left-2 right-4 bottom-2 h-1/2 bg-[#5bd797] border border-[#7df4b4] rounded-sm flex items-center px-2 opacity-50">
                                                <svg className="w-2 h-2 text-black mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3v18l7-3 7 3V3H5zm2 2h10v11.83l-5-2.14-5 2.14V5z"/></svg>
                                                <span className="text-black text-[9px] font-semibold">Terms & Conditions Audio Track</span>
                                              </div>
                                           )}
                                         </div>
                                       </div>
                                    </div>
                                    <div className="h-6 bg-[#323232] border-t border-black px-4 flex items-center gap-4 text-[10px]">
                                      {previewData.terms && (
                                        <div className="text-white/60">
                                          <span className="text-white/60 mr-1">Terms:</span>
                                          {previewData.terms.slice(0,40)}...
                                        </div>
                                      )}
                                      <div className="ml-auto flex gap-3 text-white">
                                        {previewData.paymentLinks?.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                          <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white/80">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Render Stripe
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {invoiceTemplate === "detailed" && (
                            <div className="flex flex-col flex-1 bg-[#FDFDFD] text-black relative print:bg-white p-10 md:p-16 h-full font-mono text-sm shadow-inner" style={{ fontFamily: '"Courier Prime", Courier, monospace' }}>
                              
                              <div className="flex justify-between items-start mb-12">
                                <div className="text-left w-1/3">
                                  {previewData.logoUrl ? (
                                    <div className="mb-4">
                                      <img src={previewData.logoUrl} alt="Logo" className="h-16 object-contain grayscale" />
                                    </div>
                                  ) : (
                                    <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 font-bold text-lg uppercase tracking-tight" title="Click to edit">
                                      {previewData.senderName || "JUNEDIT"}
                                    </h2>
                                  )}
                                  <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 text-sm mt-2" title="Click to edit">
                                    {previewData.senderEmail || 'hello@junedit.com'}
                                  </p>
                                  {previewData.senderAddress && (
                                    <p onClick={() => document.getElementById('standalone-senderAddress')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 text-sm mt-1 whitespace-pre-wrap" title="Click to edit">
                                      {previewData.senderAddress}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right w-1/3">
                                   <div className="text-xl font-bold uppercase mb-4 border-b-2 border-black inline-block pb-1">INVOICE</div>
                                   <div className="flex flex-col items-end gap-1 text-sm">
                                     <div className="flex gap-4">
                                       <span className="font-bold">NO:</span>
                                       <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 inline-block w-24 text-left" title="Click to edit">{previewData.invoiceNumber}</span>
                                     </div>
                                     <div className="flex gap-4">
                                       <span className="font-bold">DATE:</span>
                                       <span className="inline-block w-24 text-left">{formatInvoiceDate(previewData.date || previewData.createdAt)}</span>
                                     </div>
                                   </div>
                                </div>
                              </div>

                              <div className="mb-12">
                                <p className="font-bold uppercase inline-block bg-[#000000] text-white px-2 py-0.5 shadow-[2px_2px_0_0_var(--brandColor)] mb-2">SCENE START</p>
                                <div className="mt-4">
                                  <span className="font-bold uppercase tracking-widest">INT. INVOICE - DAY</span>
                                </div>
                                <div className="mt-4 max-w-2xl px-4">
                                  We see the details for <span onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 font-bold underline uppercase" title="Click to edit">{previewData.clientName || "Valued Client"}</span>. 
                                  Contact them at <span onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1" title="Click to edit">{previewData.email}</span>.
                                  {previewData.clientAddress && (
                                    <span onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 mt-1 block" title="Click to edit">
                                      Location: {previewData.clientAddress}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {previewData.welcomeMessage && (
                                <div className="mb-10 w-full flex flex-col items-center">
                                  <div className="w-[40%] text-center font-bold uppercase mb-2">DIRECTOR</div>
                                  <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 w-[60%] text-center border-l border-black pl-4 py-2" title="Click to edit">
                                    (smiling)<br/><br/>
                                    {previewData.welcomeMessage}
                                  </div>
                                </div>
                              )}

                              <div className="mb-12 w-full flex flex-col items-center">
                                  <div className="w-[40%] text-center font-bold uppercase mb-2">SERVICES RENDERED</div>
                                  <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 w-[60%] text-left whitespace-pre-wrap" title="Click to edit">
                                    {previewData.desc}
                                  </div>
                                  {(previewData.format || previewData.revisions) && (
                                    <div className="w-[60%] text-left mt-4 text-xs">
                                      <span className="font-bold underline">NOTE:</span>
                                      {previewData.format && ` Format delivered: ${previewData.format}. `}
                                      {previewData.revisions && ` Revisions included: ${previewData.revisions}.`}
                                    </div>
                                  )}
                              </div>

                              <div className="mt-8 flex justify-end w-full pb-8 border-b-2 border-black border-dashed">
                                <table className="w-64 text-right">
                                  <tbody>
                                    <tr className="border-b border-zinc-200">
                                      <td className="py-2 pr-4 font-bold">SUBTOTAL:</td>
                                      <td className="py-2">{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                    {Number(previewData.discount || 0) > 0 && (
                                      <tr className="border-b border-zinc-200 text-[#D70015]">
                                        <td className="py-2 pr-4 font-bold">DISCOUNT:</td>
                                        <td className="py-2">-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                    {Number(previewData.taxRate || 0) > 0 && (
                                      <tr className="border-b border-zinc-200">
                                        <td className="py-2 pr-4 font-bold">TAX ({previewData.taxRate}%):</td>
                                        <td className="py-2">{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                    {Number(previewData.amountPaid || 0) > 0 && (
                                      <tr className="border-b border-zinc-200 text-green-600">
                                        <td className="py-2 pr-4 font-bold">PAID:</td>
                                        <td className="py-2">-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                      </tr>
                                    )}
                                    <tr className="border-t-[3px] border-black text-xl font-bold bg-zinc-100">
                                      <td className="py-4 pr-4">TOTAL DUE:</td>
                                      <td className="py-4 text-[var(--brandColor)] mix-blend-multiply">
                                        {getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              
                              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 text-xs">
                                <div>
                                  {previewData.terms && (
                                    <>
                                      <div className="font-bold underline mb-2">TERMS & CONDITIONS</div>
                                      <div onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 whitespace-pre-wrap uppercase" title="Click to edit">
                                        {previewData.terms}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-bold underline mb-2">DUE DATE</div>
                                  <div onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:bg-zinc-100 p-1 -m-1 uppercase font-bold text-lg" title="Click to edit">
                                    {previewData.dueDate || "UPON RECEIPT"}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-12 text-center uppercase tracking-[0.2em] text-xs font-bold border-t border-black pt-4">
                                FADE OUT.
                              </div>

                              <div className="mt-auto px-1 pt-8">
                                  <div className="flex flex-wrap gap-4 items-center justify-center print:hidden">
                                    {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                      <div className="flex gap-4">
                                        {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                          <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#000000] hover:bg-[#141414] text-white font-bold py-3 px-8 border-2 border-black rounded-none uppercase tracking-[0.2em] text-xs">
                                            PAY [STRIPE]
                                          </a>
                                        )}
                                        {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                          <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-transparent hover:bg-zinc-100 text-black font-bold py-3 px-8 border-2 border-black rounded-none uppercase tracking-[0.2em] text-xs">
                                            PAY [PAYPAL]
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-[#000000] text-white font-bold py-3 px-8 border-2 border-black rounded-none uppercase tracking-[0.2em] text-xs">
                                        CONTACT FOR PAYMENT
                                      </a>
                                    )}
                                  </div>
                              </div>
                            </div>
                          )}
                          {invoiceTemplate === "corporate" && (
                            <div className="flex flex-col flex-1 bg-[#121212] text-white p-4 print:bg-white print:p-0">
                              <div className="w-full h-full border-[12px] border-[#1a1a1a] flex flex-col font-mono uppercase bg-[#000000]">
                                {/* Clapperboard Sticks */}
                                <div className="h-12 w-full flex items-center bg-[#000000] overflow-hidden relative border-b-4 border-black">
                                  <div className="absolute inset-0 w-[150%]" style={{ background: "repeating-linear-gradient(60deg, #111, #111 40px, #EAEAEA 40px, #EAEAEA 80px)", transform: "translateX(-15px)" }}></div>
                                  <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-[#000000]/50 backdrop-blur-sm shadow-2xl z-10"></div>
                                </div>
                                
                                <div className="flex-1 bg-[#000000] flex flex-col p-4 md:p-10 relative">
                                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                                    <div className="w-full md:w-3/5 border-2 border-white/20 rounded flex flex-col items-start bg-[#000000]/20">
                                      <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em] w-full">
                                        PROD. (SENDER)
                                      </div>
                                      <div className="p-4 flex flex-col items-start w-full">
                                        {previewData.logoUrl ? (
                                          <img src={previewData.logoUrl} alt="Logo" className="h-8 object-contain mb-2 invert print:invert-0" />
                                        ) : (
                                          <div onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 font-black text-2xl tracking-[0.2em] break-words" title="Click to edit">
                                            {previewData.senderName || "JUNEDIT PRODUCTION"}
                                          </div>
                                        )}
                                        <div onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xs mt-2 text-white/80" title="Click to edit">{previewData.senderEmail || 'HELLO@JUNEDIT.COM'}</div>
                                        {previewData.senderAddress && (
                                          <div onClick={() => document.getElementById('standalone-senderAddress')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xs whitespace-pre-wrap mt-1 text-white/60 max-w-xs" title="Click to edit">{previewData.senderAddress}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full md:w-2/5 border-2 border-white/20 rounded flex flex-col bg-[#000000]/20">
                                      <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em] flex justify-between">
                                          <span>ROLL (INV NO)</span>
                                          <span className="text-[var(--brandColor)] opacity-70">PAY BY {previewData.dueDate || "UPON RECEIPT"}</span>
                                      </div>
                                      <div className="p-4 flex items-center justify-center h-full">
                                        <div onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-white/10 p-4 font-black text-5xl md:text-6xl text-center tabular-nums tracking-[0.02em]" title="Click to edit">
                                          {previewData.invoiceNumber}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col md:flex-row gap-4 mb-4 h-full md:h-auto">
                                    <div className="w-full md:w-1/2 border-2 border-white/20 rounded flex flex-col bg-[#000000]/20">
                                      <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em]">
                                        SCENE (CLIENT)
                                      </div>
                                      <div className="p-4 flex flex-col h-full">
                                        <div onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 font-bold text-xl break-words line-clamp-2" title="Click to edit">{previewData.clientName || "VALUED CLIENT"}</div>
                                        <div onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xs mt-1 text-white/80" title="Click to edit">{previewData.email}</div>
                                        {previewData.clientAddress && (
                                          <div onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xs whitespace-pre-wrap mt-1 text-white/60" title="Click to edit">{previewData.clientAddress}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-full md:w-1/2 flex gap-4 h-full">
                                      <div className="w-1/2 border-2 border-white/20 rounded flex flex-col bg-[#000000]/20 min-h-[120px]">
                                        <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em]">
                                          TAKE (DATE)
                                        </div>
                                        <div className="p-4 flex items-center justify-center font-bold text-2xl text-center h-full tabular-nums text-zinc-200">
                                          {formatInvoiceDate(previewData.date || previewData.createdAt).toUpperCase()}
                                        </div>
                                      </div>
                                      <div className="w-1/2 border-2 border-[var(--brandColor)] rounded flex flex-col bg-[var(--brandColor)]/10 min-h-[120px]">
                                        <div className="px-2 py-1 border-b-2 border-[var(--brandColor)]/50 text-[10px] text-[var(--brandColor)] font-bold tracking-[0.2em] drop-shadow">
                                          SYNC (DUE)
                                        </div>
                                        <div className="p-4 flex flex-col items-center justify-center font-black text-2xl lg:text-3xl tracking-[0.02em] text-[var(--brandColor)] text-center h-full tabular-nums drop-shadow-md">
                                          <span className="text-sm opacity-60 font-medium mb-1">{getCurrencySymbol(previewData?.currency)}</span>
                                          {computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-2 border-white/20 rounded flex flex-col flex-1 mb-4 bg-[#000000]/20">
                                      <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em] flex items-center">
                                        <div className="w-3/4 pr-2">NOTES & DESC</div>
                                        <div className="w-1/4 pl-2 text-right">AMT</div>
                                      </div>
                                      <div className="flex flex-grow items-stretch w-full divide-x-2 divide-white/20">
                                        <div className="w-3/4 p-4 flex flex-col">
                                          <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 font-bold text-lg md:text-2xl mb-4 whitespace-pre-wrap leading-tight text-white" title="Click to edit">
                                            {previewData.desc}
                                          </div>
                                          {previewData.welcomeMessage && (
                                              <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xs text-white/60 mb-4 whitespace-pre-wrap" title="Click to edit">
                                                {previewData.welcomeMessage}
                                              </div>
                                          )}
                                          {(previewData.format || previewData.revisions) && (
                                            <div className="mt-auto flex flex-wrap gap-2 pt-4">
                                              {previewData.format && (
                                                <div className="border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/80">FMT: {previewData.format}</div>
                                              )}
                                              {previewData.revisions && (
                                                <div className="border border-white/20 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/80">REV: {previewData.revisions}</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="w-1/4 p-4 h-full flex flex-col items-end justify-center text-xl md:text-3xl font-black tabular-nums text-white">
                                           <span className="text-sm font-medium text-white/60 mb-1">{getCurrencySymbol(previewData?.currency)}</span>
                                           <span onClick={() => document.getElementById('standalone-amount')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 break-words max-w-full text-right" title="Click to edit">{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                        </div>
                                      </div>
                                  </div>

                                  <div className="flex flex-col xl:flex-row gap-4 mb-4">
                                      <div className="w-full xl:w-2/3 border-2 border-white/20 rounded flex flex-col bg-[#000000]/20">
                                        <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white/60 font-bold tracking-[0.2em] border-r border-white/20">
                                            <div className="w-full text-center">T&C</div>
                                        </div>
                                        <div className="flex flex-col md:flex-row h-full">
                                          <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-white/20 flex flex-col">
                                            {previewData.terms && (
                                              <div onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 text-[10px] leading-relaxed whitespace-pre-wrap text-white/60 flex-1" title="Click to edit">
                                                <span className="font-bold underline text-zinc-200">TERMS:</span><br/>{previewData.terms}
                                              </div>
                                            )}
                                          </div>
                                          <div className="w-full md:w-1/2 p-4 flex flex-col">
                                            {previewData.additionalNotes && (
                                              <div onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 text-[10px] leading-relaxed whitespace-pre-wrap text-white/60 flex-1" title="Click to edit">
                                                <span className="font-bold underline text-zinc-200">NOTES:</span><br/>{previewData.additionalNotes}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="w-full xl:w-1/3 border-2 border-white/20 rounded bg-white/5 flex flex-col text-sm font-bold tabular-nums">
                                        <div className="px-2 py-1 border-b-2 border-white/20 text-[10px] text-white font-black tracking-[0.2em] uppercase">
                                          FINANCIALS
                                        </div>
                                        <div className="p-4 space-y-2 flex-grow flex flex-col justify-center">
                                          <div className="flex justify-between items-center text-white/80">
                                            <span className="text-xs">SUB:</span>
                                            <span>{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                          </div>
                                          {Number(previewData.discount || 0) > 0 && (
                                            <div className="flex justify-between items-center text-[#FF453A]">
                                              <span className="text-xs">DISC:</span>
                                              <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                          )}
                                          {Number(previewData.taxRate || 0) > 0 && (
                                            <div className="flex justify-between items-center text-white/80">
                                              <span className="text-xs">TAX ({previewData.taxRate}%):</span>
                                              <span>{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                          )}
                                          {Number(previewData.amountPaid || 0) > 0 && (
                                            <div className="flex justify-between items-center text-green-400">
                                              <span className="text-xs">PAID:</span>
                                              <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                  </div>

                                  <div className="border-t-2 border-white/20 pt-4 flex gap-2 justify-end print:hidden">
                                      {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                        <>
                                          {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                            <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#635BFF] hover:bg-[#524be0] text-white font-bold py-2.5 px-6 rounded text-xs transition-colors shadow">
                                              PAY [STRIPE]
                                            </a>
                                          )}
                                          {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                            <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#00457C] hover:bg-[#003865] text-white font-bold py-2.5 px-6 rounded text-xs transition-colors shadow">
                                              PAY [PAYPAL]
                                            </a>
                                          )}
                                        </>
                                      ) : (
                                        <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-[var(--brand-primary)] hover:bg-[#FF6961] text-white font-bold py-2.5 px-6 rounded text-xs transition-colors shadow">
                                          CONTACT TO PAY
                                        </a>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          {invoiceTemplate === "creative" && (
                            <div className="flex flex-col flex-1 bg-[#000000] text-white px-2 py-4 relative overflow-hidden font-mono text-xs select-none p-4 md:p-10 border-[12px] border-[#111]">
                              {/* Viewfinder Safe Action / Title Grid */}
                              <div className="absolute inset-4 border border-white/20 pointer-events-none z-0"></div>
                              <div className="absolute inset-8 border border-white/[0.04] pointer-events-none z-0"></div>
                              
                              {/* Crosshairs */}
                              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 pointer-events-none z-0"></div>
                              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 pointer-events-none z-0"></div>
                              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-0 border border-white/30 rounded-full"></div>

                              {/* Top Bar - Camera Settings */}
                              <div className="flex justify-between items-center bg-[#000000]/60 backdrop-blur-sm p-2 z-10 pt-1 font-bold text-[10px] md:text-xs">
                                <div className="flex gap-4 md:gap-10 items-center text-white/80">
                                  <span className="text-white">FPS 24.00</span>
                                  <span>SHUTTER 180.0°</span>
                                  <span>EI 800</span>
                                  <span>ND 1.2</span>
                                  <span>WB 5600K  CC 0</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                  <div className="flex items-center gap-2 text-white">
                                    <span className="animate-pulse text-[#FF3B30] text-lg leading-none">●</span>
                                    <span>REC</span>
                                  </div>
                                  <span className="text-[#34C759] border border-[#34C759]/50 px-1">BAT 98%</span>
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col z-10 p-4 relative">
                                
                                {/* Top Left & Right Data */}
                                <div className="flex justify-between items-start mb-12">
                                  <div>
                                    <h1 className="text-xl md:text-3xl font-black text-white tracking-[0.2em] uppercase mb-1">INVOICE: <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-white/20 px-1 text-[#FF3B30]" title="Click to edit">{previewData.invoiceNumber}</span></h1>
                                    <div className="text-white/60">
                                      DATE: <span className="text-white">{formatInvoiceDate(previewData.date || previewData.createdAt)}</span><br/>
                                      DUE: <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:bg-white/20 px-1 text-white/80" title="Click to edit">{previewData.dueDate || "UPON RECEIPT"}</span>
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    {previewData.logoUrl ? (
                                      <div className="mb-2 bg-[#000000]/50 p-1 rounded">
                                        <img src={previewData.logoUrl} alt="Logo" className="h-8 object-contain invert" />
                                      </div>
                                    ) : (
                                      <div onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 font-black text-xl tracking-[0.2em] text-[#E33B2E]" title="Click to edit">
                                        {previewData.senderName || "JUNEDIT"}
                                      </div>
                                    )}
                                    <div onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-white/60" title="Click to edit">
                                      {previewData.senderEmail || 'HELLO@JUNEDIT.COM'}
                                    </div>
                                    {previewData.senderAddress && (
                                      <div onClick={() => document.getElementById('standalone-senderAddress')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-white/60 mt-1 max-w-xs whitespace-pre-wrap text-right" title="Click to edit">
                                        {previewData.senderAddress}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Center Target Area */}
                                <div className="flex-grow flex items-center justify-center pointer-events-none">
                                  {previewData.welcomeMessage && (
                                    <div className="bg-[#000000]/70 border border-white/20 p-4 text-center max-w-lg backdrop-blur pointer-events-auto">
                                      <div className="text-[#E33B2E] font-bold mb-2 border-b border-white/20 pb-1">MESSAGE_FROM_DIRECTOR</div>
                                      <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 whitespace-pre-wrap text-white/80" title="Click to edit">
                                        {previewData.welcomeMessage}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Left: Client & Description */}
                                <div className="mt-auto flex flex-col md:flex-row gap-10 items-end justify-between">
                                  <div className="bg-[#000000]/60 border border-white/20 p-4 w-full md:w-1/2 backdrop-blur relative">
                                    <div className="absolute -top-3 -left-[1px] bg-[var(--brand-primary)] text-white font-bold px-2 py-0.5 text-[9px]">SUBJECT_INFO</div>
                                    <div className="text-white/60 mb-2">TC {new Date().toISOString().substring(11, 23)}</div>
                                    <div onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 font-bold text-lg text-white mb-1" title="Click to edit">
                                      {previewData.clientName || "VALUED CLIENT"}
                                    </div>
                                    <div onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-white/60 mb-2" title="Click to edit">
                                      {previewData.email}
                                    </div>
                                    {previewData.clientAddress && (
                                      <div onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-white/60 mb-4 whitespace-pre-wrap" title="Click to edit">
                                        {previewData.clientAddress}
                                      </div>
                                    )}
                                    <div className="border-t border-white/20 pt-2 text-[#E33B2E]">DESC:</div>
                                    <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 font-bold text-sm text-zinc-200 whitespace-pre-wrap mb-2 leading-tight" title="Click to edit">
                                      {previewData.desc}
                                    </div>
                                    <div className="flex gap-4 text-white/60">
                                      {previewData.format && (
                                        <div>FMT: <span className="text-white">{previewData.format}</span></div>
                                      )}
                                      {previewData.revisions && (
                                        <div>REV: <span className="text-white">{previewData.revisions}</span></div>
                                      )}
                                    </div>
                                    {(previewData.terms || previewData.additionalNotes) && (
                                      <div className="mt-4 border-t border-white/20 pt-2 flex flex-col gap-2">
                                        {previewData.terms && (
                                          <div onClick={() => document.getElementById('standalone-terms')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-[9px] text-white/60 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                            <span className="text-white/80">TERMS:</span> {previewData.terms}
                                          </div>
                                        )}
                                        {previewData.additionalNotes && (
                                          <div onClick={() => document.getElementById('standalone-additionalNotes')?.focus()} className="cursor-pointer hover:bg-white/20 p-1 text-[9px] text-white/60 leading-relaxed whitespace-pre-wrap" title="Click to edit">
                                            <span className="text-white/80">NOTES:</span> {previewData.additionalNotes}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Bottom Right: Financials */}
                                  <div className="bg-[#000000]/60 border border-white/20 p-4 w-full md:w-[40%] backdrop-blur relative">
                                    <div className="absolute -top-3 -right-[1px] bg-[#E33B2E] text-white font-bold px-2 py-0.5 text-[9px]">TOTAL_VALUE</div>
                                    <div className="space-y-1 mb-4 text-white/60">
                                      <div className="flex justify-between">
                                        <span>SUBTOTAL</span>
                                        <span className="text-white">{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                      {Number(previewData.discount || 0) > 0 && (
                                        <div className="flex justify-between text-white/80">
                                          <span>DISCOUNT</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                      {Number(previewData.taxRate || 0) > 0 && (
                                        <div className="flex justify-between">
                                          <span>TAX ({previewData.taxRate}%)</span>
                                          <span className="text-white">{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                      {Number(previewData.amountPaid || 0) > 0 && (
                                        <div className="flex justify-between text-[#34C759]">
                                          <span>PAID</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="border-t-2 border-white/40 pt-2 flex justify-between items-end">
                                      <span className="text-white/60 font-bold">BAL</span>
                                      <span className="text-3xl md:text-4xl text-white font-black tabular-nums tracking-[0.02em]">
                                        {getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/20 print:hidden text-center flex flex-col gap-2">
                                      <div className="text-[10px] text-white/60">TRANSMIT REMITTANCE:</div>
                                      {previewData.paymentLinks && Object.values(previewData.paymentLinks).some((v: any) => v.enabled) ? (
                                        <div className="flex gap-2 justify-center">
                                          {previewData.paymentLinks.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                            <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 hover:bg-[var(--brand-primary)] hover:text-white border border-white text-white font-bold py-1.5 px-4 text-xs transition-colors">
                                              STRIPE
                                            </a>
                                          )}
                                          {previewData.paymentLinks.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                            <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="flex-1 bg-white/10 hover:bg-[var(--brand-primary)] hover:text-white border border-white text-white font-bold py-1.5 px-4 text-xs transition-colors">
                                              PAYPAL
                                            </a>
                                          )}
                                        </div>
                                      ) : (
                                        <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com') + "?subject=Payment%20Arrangement"} className="bg-white/10 hover:bg-[var(--brand-primary)] hover:text-white border border-white text-white font-bold py-1.5 px-4 text-xs transition-colors block text-center">
                                          INITIATE TRANSFER
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Bottom Bar Settings */}
                              <div className="flex justify-between items-center bg-[#000000]/60 backdrop-blur-sm p-2 z-10 pb-1 text-[10px] md:text-xs">
                                <div className="text-white/60 font-bold">CH 1/2</div>
                                <div className="flex gap-2">
                                  <div className="w-16 h-2 bg-gradient-to-r from-[#34C759] via-[#FFCC00] to-[#FF3B30] rounded-full opacity-70"></div>
                                  <div className="w-16 h-2 bg-gradient-to-r from-[#34C759] via-[#FFCC00] to-[#FF3B30] rounded-full opacity-70"></div>
                                </div>
                                <div className="text-white/60">A001 C014 05032M R7J</div>
                              </div>
                            </div>
                          )}
                          {invoiceTemplate === "callsheet" && (
                            <div className="flex flex-col flex-1 bg-[var(--brand-primary)] text-white p-10 font-sans border-2 border-black print:border-none print:p-0 relative h-full">
                               {/* content */}
                               <div className="flex justify-between items-start border-b-[6px] border-black pb-4 mb-4">
                                  <div className="w-1/3">
                                     <div className="text-2xl font-black uppercase tracking-[0.02em] mb-1">{previewData.senderName || "PRODUCTION CO"}</div>
                                     <div className="text-[10px] uppercase font-bold">{previewData.senderAddress}</div>
                                     <div className="text-[10px] uppercase font-bold">{previewData.senderEmail}</div>
                                  </div>
                                  <div className="w-1/3 text-center flex flex-col items-center justify-center">
                                     <div className="text-3xl font-black uppercase tracking-[0.2em] border-[3px] border-black inline-block px-4 py-1 mb-2">CALL SHEET</div>
                                     <div className="text-sm font-bold uppercase">INVOICE #{previewData.invoiceNumber}</div>
                                  </div>
                                  <div className="w-1/3 text-right">
                                     <div className="text-xs font-bold uppercase mb-1">DATE: <span className="underline">{formatInvoiceDate(previewData.date || previewData.createdAt)}</span></div>
                                     <div className="text-xs font-bold uppercase text-[#D70015]">DUE DATE: <span className="underline">{previewData.dueDate || "UPON RECEIPT"}</span></div>
                                  </div>
                               </div>

                               <div className="flex border-[3px] border-black mb-4">
                                  <div className="w-1/3 border-r-[3px] border-black p-3 flex flex-col justify-center text-center">
                                     <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-600">CLIENT / AGENCY</div>
                                     <div className="font-black text-xl uppercase leading-tight">{previewData.clientName || "CLIENT"}</div>
                                  </div>
                                  <div className="w-1/3 border-r-[3px] border-black p-3 bg-[var(--brand-primary)] text-white flex flex-col justify-center text-center">
                                     <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-700">TOTAL DUE</div>
                                     <div className="font-black text-3xl tracking-[0.02em]">{getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                  </div>
                                  <div className="w-1/3 p-3 flex flex-col justify-center text-center bg-gray-100">
                                     <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-gray-600">PROJECT / REVS</div>
                                     <div className="font-black text-xl uppercase tracking-widest">{previewData.format || "N/A"} / {previewData.revisions || "VAR"}</div>
                                  </div>
                               </div>

                               <div className="border-[3px] border-black mb-6">
                                   <div className="bg-[#000000] text-white font-bold p-1.5 uppercase text-center text-xs tracking-[0.2em]">Important Locations & Weather</div>
                                   <div className="flex">
                                       <div className="w-1/2 border-r border-black p-3 text-[10px] uppercase font-bold leading-relaxed">
                                          <span className="bg-[#000000] text-white px-1">NEAREST HOSPITAL:</span><br/>
                                          City General Hospital - Trauma Center<br/>
                                          123 Emergency St, NY 10001
                                       </div>
                                       <div className="w-1/2 p-3 text-[10px] uppercase font-bold leading-relaxed">
                                          <span className="bg-[#000000] text-white px-1">WEATHER & SUN:</span><br/>
                                          Sunny, High 75F, Low 55F.<br/>Sunrise 06:12, Sunset 19:40.
                                       </div>
                                   </div>
                               </div>

                               {/* Line Items / Scope of work */}
                               <div className="border-[3px] border-black mb-6 flex-grow">
                                   <div className="bg-[#000000] text-white font-bold p-1.5 uppercase text-xs tracking-[0.2em] flex justify-between px-4">
                                       <span>SCENES/TASKS TO BE SHOT (SCOPE OF WORK)</span>
                                       <span>AMOUNT</span>
                                   </div>
                                   <div className="p-5 text-sm font-bold whitespace-pre-wrap uppercase leading-loose border-b-[3px] border-black min-h-[150px]">
                                       {previewData.desc}
                                   </div>
                                   <div className="flex bg-gray-100">
                                       <div className="w-3/4 p-2 text-right text-[10px] font-black uppercase border-r-[3px] border-black">Subtotal</div>
                                       <div className="w-1/4 p-2 text-right font-black text-sm">{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                   </div>
                                   {Number(previewData.discount) > 0 && (
                                     <div className="flex border-t-[3px] border-black">
                                         <div className="w-3/4 p-2 text-right text-[10px] font-black uppercase border-r-[3px] border-black text-[#D70015]">Discount</div>
                                         <div className="w-1/4 p-2 text-right font-black text-sm text-[#D70015]">-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                     </div>
                                   )}
                                   {Number(previewData.taxRate) > 0 && (
                                     <div className="flex bg-gray-100 border-t-[3px] border-black">
                                         <div className="w-3/4 p-2 text-right text-[10px] font-black uppercase border-r-[3px] border-black">Tax ({previewData.taxRate}%)</div>
                                         <div className="w-1/4 p-2 text-right font-black text-sm">{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                     </div>
                                   )}
                                   {Number(previewData.amountPaid) > 0 && (
                                     <div className="flex border-t-[3px] border-black">
                                         <div className="w-3/4 p-2 text-right text-[10px] font-black uppercase border-r-[3px] border-black text-green-700">Amount Paid</div>
                                         <div className="w-1/4 p-2 text-right font-black text-sm text-green-700">-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                     </div>
                                   )}
                               </div>

                               {/* Notes */}
                               {(previewData.terms || previewData.welcomeMessage || previewData.additionalNotes) && (
                                   <div className="border-[3px] border-black mb-6">
                                       <div className="bg-[#000000] text-white font-bold p-1.5 uppercase text-center text-xs tracking-[0.2em]">NOTES & TERMS</div>
                                       <div className="p-4 text-[10px] font-bold uppercase space-y-4 leading-relaxed bg-gray-50">
                                           {previewData.welcomeMessage && (
                                               <div><span className="bg-[#000000] text-white px-1">DIRECTOR:</span> {previewData.welcomeMessage}</div>
                                           )}
                                           {previewData.terms && (
                                               <div><span className="bg-[#000000] text-white px-1">TERMS:</span> {previewData.terms}</div>
                                           )}
                                           {previewData.additionalNotes && (
                                               <div><span className="bg-[#000000] text-white px-1">ADDITIONAL:</span> {previewData.additionalNotes}</div>
                                           )}
                                       </div>
                                   </div>
                               )}

                               {/* Payment Links pretending to be signature / sign-off */}
                               <div className="mt-auto border-t-[6px] border-black pt-6 flex flex-col items-center print:hidden">
                                  <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                      REMITTANCE OPTIONS CACHED:
                                  </div>
                                  <div className="flex flex-wrap gap-4 justify-center">
                                     {previewData.paymentLinks?.stripe?.enabled && previewData.paymentLinks.stripe?.url && (
                                        <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="bg-[#000000] hover:bg-gray-800 text-white font-black py-3 px-8 uppercase text-xs tracking-[0.2em] transition-transform hover:scale-105">
                                           PAY VIA STRIPE
                                        </a>
                                     )}
                                     {previewData.paymentLinks?.paypal?.enabled && previewData.paymentLinks.paypal?.url && (
                                        <a href={previewData.paymentLinks.paypal.url} target="_blank" rel="noreferrer" className="bg-[#000000] hover:bg-gray-800 text-white font-black py-3 px-8 uppercase text-xs tracking-[0.2em] transition-transform hover:scale-105">
                                           PAY VIA PAYPAL
                                        </a>
                                     )}
                                     {!previewData.paymentLinks?.stripe?.enabled && !previewData.paymentLinks?.paypal?.enabled && (
                                        <a href={"mailto:" + (previewData.senderEmail || 'hello@junedit.com')} className="bg-[#000000] hover:bg-gray-800 text-white font-black py-3 px-8 uppercase text-xs tracking-[0.2em] transition-transform hover:scale-105">
                                           CONTACT PAYMASTER
                                        </a>
                                     )}
                                  </div>
                               </div>

                            </div>
                          )}

                          {invoiceTemplate === "vhs" && (
                            <div className="flex flex-col flex-1 bg-white/5 border-[16px] border-black text-[#00ff00] p-10 md:p-12 relative overflow-hidden font-mono uppercase shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" style={{ textShadow: "2px 0 0 red, -2px 0 0 cyan", fontFamily: "'Courier New', monospace" }}>
                              {/* Scanlines */}
                              <div className="absolute inset-0 pointer-events-none z-10" style={{ background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255,255,255,0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 4px, 6px 100%" }}></div>
                              
                              <div className="text-4xl font-black mb-8 blur-[0.5px]">PLAY ►</div>
                              
                              <div className="flex justify-between blur-[0.5px] border-b-4 border-[#00ff00]/50 pb-8 mb-8">
                                <div className="w-1/2">
                                  <div className="text-xl mb-4 text-[#00ff00]">SP  0:14:32</div>
                                  <div onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-4xl font-black truncate" title="Click to edit">{previewData.senderName || "JUNEDIT STUDIO"}</div>
                                  <div onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xl font-bold mt-2" title="Click to edit">{previewData.senderEmail}</div>
                                </div>
                                <div className="text-right w-1/2">
                                  <div className="text-xl mb-4">{formatInvoiceDate(previewData.date || previewData.createdAt)}</div>
                                  <div onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-3xl font-black" title="Click to edit">INV-{previewData.invoiceNumber}</div>
                                </div>
                              </div>
                              
                              <div className="blur-[0.5px] mb-12">
                                <div className="text-xl mb-2 text-white">BILL TO:</div>
                                <div onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-4xl font-bold text-white/80" title="Click to edit">{previewData.clientName || "CLIENT"}</div>
                                <div onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xl mt-2" title="Click to edit">{previewData.email}</div>
                              </div>
                              
                              <div className="flex-grow blur-[0.5px]">
                                <div className="text-2xl font-black mb-4 underline text-white">PROGRAM</div>
                                <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-white/10 p-2 -m-2 text-2xl leading-relaxed whitespace-pre-wrap text-[#00ff00]" title="Click to edit">
                                  {previewData.desc}
                                </div>
                                {(previewData.welcomeMessage || previewData.terms) && (
                                  <div className="mt-8 border-t-2 border-dashed border-[#00ff00]/50 pt-4 text-xl">
                                    {previewData.welcomeMessage && <div className="mb-4">" {previewData.welcomeMessage} "</div>}
                                    {previewData.terms && <div className="text-[#FF453A]">NOTE: {previewData.terms}</div>}
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-12 blur-[0.5px] border-t-4 border-[#00ff00]/50 pt-8 flex justify-between items-end">
                                <div>
                                  <div onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:bg-white/10 p-1 -m-1 text-xl mb-2 text-white" title="Click to edit">REC DUE: {previewData.dueDate || "UPON RECEIPT"}</div>
                                  <div className="text-xl">MODE: {previewData.format || "NTSC / VHS"}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl mb-2 text-white">TOTAL BALANCE</div>
                                  <div className="text-5xl font-black text-[#00ff00]">
                                    {getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>

                              {Number(previewData.amountPaid) > 0 && (
                                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl text-[#FF3B30] font-black blur-[2px] opacity-70 tracking-[0.2em] rotate-[-15deg] pointer-events-none mix-blend-screen scale-150">
                                  OVERWRITTEN
                                </div>
                              )}
                            </div>
                          )}

                          {invoiceTemplate === "receipt" && (
                            <div className="flex flex-col flex-1 items-center bg-[#eaeaea] p-4 md:p-10 print:p-0">
                               <div className="w-full max-w-[400px] min-h-full bg-white border border-gray-200 shadow-sm p-10 md:p-10 font-mono text-xs text-black relative flex flex-col items-center" style={{ fontFamily: "Courier, monospace" }}>
                                  {/* jagged top edge effect */}
                                  <div className="absolute top-0 left-0 right-0 h-4 print:hidden" style={{ backgroundImage: "linear-gradient(135deg, transparent 50%, white 50%), linear-gradient(45deg, white 50%, transparent 50%)", backgroundSize: "12px 12px", backgroundPosition: "0 0", marginTop: "-12px", zIndex: 10 }}></div>
                                  
                                  <div className="text-center mb-6 w-full">
                                     <h2 onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 text-2xl font-bold uppercase mb-2" title="Click to edit">{previewData.senderName || "PRODUCTION CO"}</h2>
                                     <p onClick={() => document.getElementById('standalone-senderEmail')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 font-bold">{previewData.senderEmail}</p>
                                     {previewData.senderAddress && <p onClick={() => document.getElementById('standalone-senderAddress')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 mt-1 whitespace-pre-wrap">{previewData.senderAddress}</p>}
                                     <p className="mt-4 text-white/30 text-[10px] tracking-[0.2em]">--------------------------------------</p>
                                  </div>
                                  
                                  <div className="mb-6 w-full font-bold">
                                     <div className="flex justify-between mb-1">
                                        <span>DATE:</span>
                                        <span>{formatInvoiceDate(previewData.date || previewData.createdAt)}</span>
                                     </div>
                                     <div className="flex justify-between mb-1">
                                        <span>RCPT NO:</span>
                                        <span onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-gray-100 px-1 -mx-1">{previewData.invoiceNumber}</span>
                                     </div>
                                     <div className="flex justify-between mb-1">
                                        <span>DUE:</span>
                                        <span onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="cursor-pointer hover:bg-gray-100 px-1 -mx-1">{previewData.dueDate || "UPON RECEIPT"}</span>
                                     </div>
                                     <p className="mt-4 text-white/30 text-[10px] tracking-[0.2em]">--------------------------------------</p>
                                  </div>

                                  <div className="mb-6 w-full font-bold">
                                     <div onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 mb-2 uppercase break-words">CUSTOMER: {previewData.clientName || "VALUED CLIENT"}</div>
                                     <div onClick={() => document.getElementById('standalone-email')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 mb-2 break-all">EMAIL: {previewData.email}</div>
                                     {previewData.clientAddress && (
                                       <div onClick={() => document.getElementById('standalone-clientAddress')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 whitespace-pre-wrap">ADDR: {previewData.clientAddress}</div>
                                     )}
                                     <p className="mt-4 text-white/30 text-[10px] tracking-[0.2em]">--------------------------------------</p>
                                  </div>
                                  
                                  <div className="mb-6 w-full flex-grow">
                                     <div className="font-bold mb-4 uppercase text-center bg-[#000000] text-white py-1 transition-all">ITEMS SOLD</div>
                                     <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-gray-100 p-2 -m-2 whitespace-pre-wrap mb-6 uppercase text-sm leading-relaxed" title="Click to edit">{previewData.desc}</div>
                                     <div className="flex justify-between font-bold text-sm mb-1">
                                        <span>SUBTOTAL</span>
                                        <span>{getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                     </div>
                                     {Number(previewData.discount) > 0 && (
                                       <div className="flex justify-between text-sm mb-1">
                                          <span>DISCOUNT</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                       </div>
                                     )}
                                     {Number(previewData.taxRate) > 0 && (
                                       <div className="flex justify-between text-sm mb-1">
                                          <span>TAX ({previewData.taxRate}%)</span>
                                          <span>{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                       </div>
                                     )}
                                     {Number(previewData.amountPaid) > 0 && (
                                       <div className="flex justify-between text-sm mb-1">
                                          <span>TENDERED</span>
                                          <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                       </div>
                                     )}
                                     <p className="mt-4 text-white/30 text-[10px] tracking-[0.2em]">--------------------------------------</p>
                                  </div>
                                  
                                  <div className="mb-8 w-full border-y-[3px] border-double border-black py-4 my-4">
                                     <div className="flex justify-between text-xl font-black">
                                        <span>TOTAL</span>
                                        <span className="text-2xl tracking-[0.02em]">{getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                     </div>
                                  </div>
                                  
                                  <div className="text-center w-full mt-auto pt-8">
                                     <div className="font-bold uppercase mb-4 text-lg">*** THANK YOU ***</div>
                                     {previewData.welcomeMessage && (
                                        <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-gray-100 p-2 -m-2 text-xs uppercase font-bold mb-4 whitespace-pre-wrap">{previewData.welcomeMessage}</div>
                                     )}
                                     {previewData.terms && (
                                        <div className="text-[10px] uppercase font-bold mb-4">NOTE: {previewData.terms}</div>
                                     )}
                                     {/* Fake Barcode */}
                                     {previewData.invoiceNumber && (
                                       <div className="mt-8 flex flex-col items-center">
                                         <div className="w-full h-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iMTAwIiBmaWxsPSJibGFjayIvPjxyZWN0IHg9IjMiIHdpZHRoPSIxIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmxhY2siLz48L3N2Zz4=')] opacity-80" style={{ backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}></div>
                                         <div className="mt-1 text-[10px] tracking-[0.2em]">{previewData.invoiceNumber}</div>
                                       </div>
                                     )}
                                  </div>
                                  
                                  {/* jagged bottom edge effect */}
                                  <div className="absolute bottom-0 left-0 right-0 h-4 print:hidden" style={{ backgroundImage: "linear-gradient(-135deg, transparent 50%, white 50%), linear-gradient(-45deg, white 50%, transparent 50%)", backgroundSize: "12px 12px", backgroundPosition: "0 0", marginBottom: "-12px", zIndex: 10 }}></div>
                               </div>
                            </div>
                          )}

                          {invoiceTemplate === "storyboard" && (
                            <div className="flex flex-col flex-1 bg-[var(--brand-primary)] text-white p-4 md:p-10 font-sans h-full">
                              <div className="border-4 border-black p-4 md:p-10 mb-8 relative">
                                 {/* Optional Logo overlay top left */}
                                 {previewData.logoUrl && (
                                   <div className="absolute -top-10 -left-6 bg-white border-4 border-black p-2 max-w-[120px] shadow-[4px_4px_0px_0px_black]">
                                     <img src={previewData.logoUrl} alt="Logo" className="w-full h-auto object-contain" />
                                   </div>
                                 )}
                                 <h1 className="text-3xl md:text-5xl font-black uppercase mb-4 tracking-[0.02em] text-center md:text-right">STORYBOARD</h1>
                                 
                                 <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-t-4 border-black pt-4 gap-4 md:gap-0">
                                   <div>
                                     <div onClick={() => document.getElementById('standalone-senderName')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 font-bold text-lg uppercase" title="Click to edit">PROD: {previewData.senderName || "PRODUCTION CO"}</div>
                                     <div className="font-bold uppercase text-gray-600">{previewData.senderEmail}</div>
                                   </div>
                                   <div className="text-left md:text-center w-full md:w-auto">
                                     <div onClick={() => document.getElementById('standalone-clientName')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 font-bold text-lg uppercase bg-yellow-200 px-2" title="Click to edit">CLIENT: {previewData.clientName || "STUDIO CLIENT"}</div>
                                   </div>
                                   <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end">
                                     <div className="font-bold text-sm uppercase">DATE: {formatInvoiceDate(previewData.date || previewData.createdAt)}</div>
                                     <div onClick={() => document.getElementById('standalone-invoice')?.focus()} className="cursor-pointer hover:bg-gray-100 p-1 -m-1 font-black text-2xl uppercase mt-1 bg-[#000000] text-white px-2" title="Click to edit">INV. {previewData.invoiceNumber}</div>
                                   </div>
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-10 mb-8 flex-grow">
                                {/* Box 1 - Scope of Work */}
                                <div className="border-4 border-black shadow-[8px_8px_0px_0px_black] flex flex-col">
                                   <div className="aspect-video bg-[url('data:image/svg+xml,%3Csvg width=%2240%22 height=%2240%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath d=%22M0 40L40 0H20L0 20M40 40V20L20 40%22 fill=%22%23f3f4f6%22 fill-rule=%22evenodd%22/%3E%3C/svg%3E')] border-b-4 border-black flex items-center justify-center p-10 relative overflow-hidden group">
                                      <div className="absolute inset-0 border-8 border-white/[0.02]0 m-4 pointer-events-none"></div>
                                      <div className="absolute top-2 left-2 bg-[#000000] text-white font-bold px-2 py-1 text-xs">SCENE 1</div>
                                      <div className="absolute bottom-2 right-2 bg-[#000000] text-white font-bold px-2 py-1 text-xs">{previewData.format || "DELIVERY FORMAT"}</div>
                                      
                                      <div className="bg-white border-4 border-black px-6 py-4 transform -rotate-3 transition-transform group-hover:rotate-0 shadow-lg relative">
                                        <div className="absolute -top-3 left-1/2 w-6 h-6 bg-[#FF3B30] rounded-full border-2 border-black -translate-x-1/2 shadow-sm"></div>
                                        <p className="text-2xl font-black uppercase text-black text-center break-words tracking-[0.02em]">SCOPE OF WORK</p>
                                      </div>
                                   </div>
                                   <div className="p-4 bg-white flex-grow flex flex-col">
                                      <div className="font-bold border-b-2 border-black pb-2 mb-2 text-sm uppercase flex justify-between">
                                        <span>ACTION DESCRIPTION</span>
                                        <span>AMT: {getCurrencySymbol(previewData?.currency)}{Number(previewData.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                      <div onClick={() => document.getElementById('standalone-desc')?.focus()} className="cursor-pointer hover:bg-gray-100 p-2 -m-2 text-sm md:text-base font-bold whitespace-pre-wrap leading-relaxed flex-grow uppercase" title="Click to edit">{previewData.desc}</div>
                                   </div>
                                </div>
                                
                                {/* Box 2 - Terms and Details */}
                                <div className="border-4 border-black shadow-[8px_8px_0px_0px_black] flex flex-col">
                                   <div className="aspect-video bg-[url('data:image/svg+xml,%3Csvg width=%2220%22 height=%2220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E')] border-b-4 border-black flex items-center justify-center p-10 relative overflow-hidden group">
                                      <div className="absolute inset-0 border-8 border-white/[0.02]0 m-4 pointer-events-none"></div>
                                      <div className="absolute top-2 left-2 bg-[#000000] text-white font-bold px-2 py-1 text-xs">SCENE 2</div>
                                      <div onClick={() => document.getElementById('standalone-dueDate')?.focus()} className="absolute bottom-2 right-2 bg-red-600 text-white font-bold px-2 py-1 text-xs uppercase cursor-pointer hover:bg-[#FF3B30]" title="Click to edit">DUE: {previewData.dueDate || "UPON RECEIPT"}</div>
                                      
                                      <div className="bg-white border-4 border-black px-6 py-4 transform rotate-2 transition-transform group-hover:rotate-0 shadow-lg relative">
                                        <div className="absolute -top-2 -left-2 w-4 h-8 bg-[var(--brand-primary)] text-white border-2 border-black shadow-sm transform -rotate-45"></div>
                                        <p className="text-2xl font-black uppercase text-black text-center break-words tracking-[0.02em]">DIRECTOR'S NOTES</p>
                                      </div>
                                   </div>
                                   <div className="p-4 bg-yellow-100 flex-grow flex flex-col">
                                      <div className="font-bold border-b-2 border-black pb-2 mb-2 text-sm uppercase">TERMS & CONDITIONS</div>
                                      <div className="text-sm font-bold whitespace-pre-wrap flex-grow uppercase space-y-4">
                                        {previewData.welcomeMessage && (
                                           <div onClick={() => document.getElementById('standalone-welcomeMessage')?.focus()} className="cursor-pointer hover:bg-yellow-200 p-2 -m-2 border-l-4 border-black pl-3" title="Click to edit">{previewData.welcomeMessage}</div>
                                        )}
                                        {previewData.terms && (
                                           <div className="text-[#990000] italic border-l-4 border-red-700 pl-3">"{previewData.terms}"</div>
                                        )}
                                      </div>
                                   </div>
                                </div>
                              </div>
                              
                              {/* Total Bar */}
                              <div className="border-4 border-black flex flex-col md:flex-row mt-auto shadow-[8px_8px_0px_0px_black] bg-white z-10 relative">
                                 <div className="w-full md:w-5/12 p-10 border-b-4 md:border-b-0 md:border-r-4 border-black bg-[#252525] flex items-center justify-center text-center">
                                    <div>
                                      <div className="text-sm font-black uppercase mb-4 text-white/80 border-b-4 border-white/20 pb-2 inline-block">REMITTANCE PREFERRED</div>
                                      {previewData.paymentLinks?.stripe?.enabled && previewData.paymentLinks.stripe?.url ? (
                                        <a href={previewData.paymentLinks.stripe.url} target="_blank" rel="noreferrer" className="block w-full bg-[#000000] hover:bg-white/5 text-white font-black py-3 px-6 uppercase text-sm tracking-[0.2em] transition-transform hover:-translate-y-1 shadow-lg">
                                           PAY NOW ➔
                                        </a>
                                      ) : (
                                        <div className="text-lg font-black uppercase text-blue-950">{(previewData.senderName || "JUNEDIT")}</div>
                                      )}
                                    </div>
                                 </div>
                                 <div className="w-full md:w-7/12 p-10 md:p-10 bg-[#000000] text-white flex flex-col justify-center">
                                    {Number(previewData.discount) > 0 && (
                                      <div className="flex justify-between items-end border-b-2 border-white/20 pb-2 mb-3 font-bold text-sm uppercase text-white/40">
                                        <span>DISCOUNT</span>
                                        <span>-{getCurrencySymbol(previewData?.currency)}{Number(previewData.discount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                    )}
                                    {Number(previewData.taxRate) > 0 && (
                                      <div className="flex justify-between items-end border-b-2 border-white/20 pb-2 mb-3 font-bold text-sm uppercase text-white/40">
                                        <span>TAX / FEES ({previewData.taxRate}%)</span>
                                        <span>{getCurrencySymbol(previewData?.currency)}{computedTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-end pt-2 text-3xl md:text-4xl font-black text-white/80">
                                      <span className="tracking-[0.02em]">TOTAL</span>
                                      <span className="tracking-[0.02em]">{getCurrencySymbol(previewData?.currency)}{computedBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                 </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
                );
              })()}
           </div>
        </section>

        {/* Financial Action Center */}
        <section className="mt-8 mb-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => toast.success("Bank account integration coming soon")}
                className="bg-[#141414] hover:bg-[#161616] border border-white/[0.04] rounded-2xl p-5 text-left flex flex-col gap-3 transition-transform hover:-translate-y-1 group"
              >
                 <div className="w-10 h-10 rounded-2xl bg-white/10 text-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Connect Bank</h4>
                    <p className="text-[10px] text-white/60 font-mono">Sync transactions</p>
                 </div>
              </button>

              <button 
                onClick={() => toast.success("Tax Report generation started")}
                className="bg-[#141414] hover:bg-[#161616] border border-white/[0.04] rounded-2xl p-5 text-left flex flex-col gap-3 transition-transform hover:-translate-y-1 group"
              >
                 <div className="w-10 h-10 rounded-2xl bg-white/10 text-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Tax Report</h4>
                    <p className="text-[10px] text-white/60 font-mono">Export PDF & CSV</p>
                 </div>
              </button>

              <button 
                onClick={() => toast.success("Recurring invoice configured")}
                className="bg-[#141414] hover:bg-[#161616] border border-white/[0.04] rounded-2xl p-5 text-left flex flex-col gap-3 transition-transform hover:-translate-y-1 group"
              >
                 <div className="w-10 h-10 rounded-2xl bg-white/10 text-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.44l5.42 5.42"/></svg>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Automations</h4>
                    <p className="text-[10px] text-white/60 font-mono">Recurring invoices</p>
                 </div>
              </button>

              <button 
                onClick={() => toast.success("Feature coming soon")}
                className="bg-[#141414] hover:bg-[#161616] border border-white/[0.04] rounded-2xl p-5 text-left flex flex-col gap-3 transition-transform hover:-translate-y-1 group"
              >
                 <div className="w-10 h-10 rounded-2xl bg-white/10 text-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Activity Log</h4>
                    <p className="text-[10px] text-white/60 font-mono">View audit trail</p>
                 </div>
              </button>
           </div>
        </section>

        {/* Recent Invoices and Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-4">
           {/* Recent Invoices */}
           <section className="bg-[#000000]/50 backdrop-blur-sm border border-white/[0.02] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans">
              <div className="p-5 border-b border-white/[0.02] flex justify-between items-center bg-gradient-to-r from-zinc-900/50 to-black/50">
                 <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Receipt size={16} className="text-white/80" />
                    Recent Invoices
                 </h3>
              </div>
              <div className="overflow-x-auto min-h-[300px]">
                 {pastInvoices.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-white/[0.02] border-b border-white/[0.02]">
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Invoice</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Client</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Date</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Amt</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono"></th>
                          </tr>
                       </thead>
                       <tbody>
                          {pastInvoices.slice(0, 8).map((inv) => (
                             <tr key={inv.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                <td className="py-3 px-4 text-sm text-white/80 font-mono">
                                   <div className="font-bold text-white">INV-{inv.invoiceNumber}</div>
                                   <div className={`text-[10px] font-bold mt-0.5 ${inv.status === 'paid' ? 'text-[#34C759]' : (inv.amountPaid > 0 ? 'text-white/80' : 'text-white/60')}`}>{inv.status === 'paid' ? 'PAID' : (inv.amountPaid > 0 ? 'PARTIAL' : 'PENDING')}</div>
                                </td>
                                <td className="py-3 px-4 text-sm text-white/80">
                                   <div className="text-zinc-200 font-medium truncate max-w-[150px]">{inv.clientName || 'Unknown'}</div>
                                   <div className="text-[10px] text-white/60 truncate max-w-[150px]">{inv.email}</div>
                                </td>
                                <td className="py-3 px-4 text-sm text-white/60">{formatInvoiceDate(inv.date || inv.createdAt)}</td>
                                <td className="py-3 px-4 text-sm text-white/80 font-mono font-bold">
                                  {getCurrencySymbol(inv.currency)}{Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  {Number(inv.amountPaid || 0) > 0 && inv.status !== 'paid' && (
                                     <div className="text-[10px] text-white/60 font-normal">
                                        Paid: {getCurrencySymbol(inv.currency)}{Number(inv.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                     </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm text-right">
                                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                    {inv.status !== 'paid' && (
                                      <>
                                        <button onClick={() => setPartialPaymentInvoice(inv)} className="text-white/80 hover:text-white/80" title="Mark Partially Paid">
                                          <CreditCard size={14} />
                                        </button>
                                        <button onClick={() => handleMarkInvoicePaid(inv, true)} className="text-white/80 hover:text-white/80" title="Mark Fully Paid">
                                          <CheckCircle size={14} />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => setDeleteInvoiceId(inv.id)} className="text-zinc-600 hover:text-[#FF3B30]">
                                      <Trash size={14} />
                                    </button>
                                  </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-white/60 text-sm font-mono border-t border-white/[0.02]">
                       <Receipt className="w-8 h-8 mb-4 opacity-20" />
                       No recent invoices
                    </div>
                 )}
              </div>
           </section>

           {/* Expenses */}
           <section className="bg-[#000000]/50 backdrop-blur-sm border border-white/[0.02] rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans">
              <div className="p-5 border-b border-white/[0.02] flex justify-between items-center bg-gradient-to-r from-zinc-900/50 to-black/50">
                 <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF453A]"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    Recent Expenses
                 </h3>
              </div>
              <div className="overflow-x-auto min-h-[300px]">
                 {expenses.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-white/[0.02] border-b border-white/[0.02]">
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Item</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Category</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Date</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono">Amt</th>
                             <th className="py-3 px-4 text-xs font-bold text-white/60 uppercase tracking-[0.2em] font-mono"></th>
                          </tr>
                       </thead>
                       <tbody>
                          {expenses.slice(0, 8).map((exp) => (
                             <tr key={exp.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                <td className="py-3 px-4 text-sm text-white/80">
                                   <div className="font-bold text-zinc-200 truncate max-w-[150px]">{exp.name || exp.desc || 'Unknown Item'}</div>
                                </td>
                                <td className="py-3 px-4 text-sm text-white/60 font-mono text-[10px] uppercase">
                                   <span className="px-2 py-0.5 bg-[#141414] rounded text-white/80">{exp.category || 'Other'}</span>
                                </td>
                                <td className="py-3 px-4 text-sm text-white/60">{formatInvoiceDate(exp.date || exp.createdAt)}</td>
                                <td className="py-3 px-4 text-sm text-white/80 font-mono font-bold text-[#FF453A]">
                                  -${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-sm text-right">
                                  <button onClick={async () => {
                                      try {
                                        await deleteDoc(doc(db, "expenses", exp.id));
                                        toast.success("Expense deleted");
                                      } catch(err) {
                                        console.error(err);
                                        toast.error("Failed to delete expense");
                                      }
                                  }} className="text-zinc-600 hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash size={14} />
                                  </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-white/60 text-sm font-mono border-t border-white/[0.02]">
                       <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-20"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                       No recorded expenses
                    </div>
                 )}
              </div>
           </section>
        </div>
      </div>

      {deleteInvoiceId && (
        <div className="fixed inset-0 bg-[#000000]/90 z-[60] flex items-center justify-center p-10 backdrop-blur-sm">
           <div className="w-full max-w-md bg-[#141414] rounded-2xl p-10 border border-white/[0.04] shadow-2xl flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#FF3B30]/10 text-[#FF3B30] rounded-full flex items-center justify-center mb-6">
                 <Trash size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Invoice?</h3>
              <p className="text-sm text-white/60 mb-8">
                 This action cannot be undone. This invoice will be permanently deleted from your records.
              </p>
              <div className="flex gap-4 w-full">
                 <button 
                   onClick={() => setDeleteInvoiceId(null)}
                   className="flex-1 py-3 bg-[#141414] hover:bg-zinc-700 text-white rounded-2xl font-bold text-sm transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={async () => {
                     if (deleteInvoiceId) {
                        try {
                          await deleteDoc(doc(db, "invoices", deleteInvoiceId));
                          toast.success("Invoice deleted successfully");
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to delete invoice");
                        } finally {
                          setDeleteInvoiceId(null);
                        }
                     }
                   }}
                   className="flex-1 py-3 bg-red-600 hover:bg-[#FF6961] text-white rounded-2xl font-bold text-sm transition-colors"
                 >
                   Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-[#000000]/90 z-50 flex flex-col items-center justify-center p-10 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#141414] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.04] flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-white/[0.04] bg-[#0a0a0a]">
              <h3 className="text-white font-bold font-mono">Invoice PDF Preview</h3>
              <div className="flex gap-2">
                 <a href={pdfPreviewUrl} download={"Invoice-" + (livePreviewData?.invoiceNumber || 'draft') + ".pdf"} className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                   Download
                 </a>
                 <button onClick={() => setPdfPreviewUrl(null)} className="text-white/60 hover:text-white p-2">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
              </div>
            </div>
            <iframe src={pdfPreviewUrl} className="w-full flex-grow bg-[#000000] border-none"></iframe>
          </div>
        </div>
      )}
      
      {templateModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/90 z-50 flex items-center justify-center p-10 backdrop-blur-sm">
           <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-2xl p-10 border border-white/[0.04]">
              <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-[0.02em]">Custom Template HTML</h2>
              <input type="text" value={editTemplateName} onChange={e => setEditTemplateName(e.target.value)} placeholder="Template Name" className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-white mb-4" />
              <textarea value={editTemplateHtml} onChange={e => setEditTemplateHtml(e.target.value)} rows={12} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-white font-mono text-xs" />
              <div className="flex justify-end gap-4 mt-6">
                 <button onClick={() => setTemplateModalOpen(false)} className="px-4 py-2 text-white/60">Cancel</button>
                 <button onClick={async () => {
                    if (!editTemplateName.trim() || !editTemplateHtml.trim() || !user) return;
                    try {
                       if (editTemplateId) {
                          await updateDoc(doc(db, "customInvoiceTemplates", editTemplateId), {
                             name: editTemplateName,
                             html: editTemplateHtml,
                             updatedAt: serverTimestamp()
                          });
                          toast.success("Template updated");
                       } else {
                          await addDoc(collection(db, "customInvoiceTemplates"), {
                             ownerId: user.uid,
                             name: editTemplateName,
                             html: editTemplateHtml,
                             createdAt: serverTimestamp()
                          });
                          toast.success("Template created");
                       }
                       setTemplateModalOpen(false);
                    } catch (err: any) {
                       handleFirestoreError(err, editTemplateId ? OperationType.UPDATE : OperationType.CREATE, "customInvoiceTemplates");
                    }
                 }} className="bg-[var(--brandColor)] text-white px-6 py-2 rounded font-bold">Save</button>
              </div>
           </div>
        </div>
      )}
      {emailTemplateModalOpen && (
         <div className="fixed inset-0 bg-[#000000]/90 z-[60] flex flex-col justify-center items-center p-10 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#0a0a0a] rounded-2xl p-10 border border-white/[0.04] relative z-[61]">
               <h2 className="text-xl font-bold font-body tracking-tight tracking-[0.02em] text-white uppercase mb-6 flex items-center gap-2">
                  <Mail size={18} className="text-zinc-100" /> {editEmailTemplate?.id ? "Edit" : "New"} Template
               </h2>
               <form onSubmit={async (e) => {
                  e.preventDefault();
                  
                  const target = e.target as any;
                  const name = target.name.value;
                  const subject = target.subject.value;
                  const body = target.body.value;
                  
                  try {
                     if (editEmailTemplate?.id) {
                        await updateDoc(doc(db, "emailTemplates", editEmailTemplate.id), {
                           name, subject, body, updatedAt: serverTimestamp()
                        });
                        toast.success("Template updated");
                     } else {
                        await addDoc(collection(db, "emailTemplates"), {
                           ownerId: user?.uid,
                           name, subject, body, createdAt: serverTimestamp()
                        });
                        toast.success("Template created");
                     }
                     setEmailTemplateModalOpen(false);
                     setEditEmailTemplate(null);
                  } catch (err: any) {
                     handleFirestoreError(err, editEmailTemplate?.id ? OperationType.UPDATE : OperationType.CREATE, "emailTemplates");
                  }
               }}>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 block">Template Name</label>
                        <input name="name" required defaultValue={editEmailTemplate?.name} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors" placeholder="e.g. Initial Deposit Invoice" />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 block">Email Subject</label>
                        <input name="subject" required defaultValue={editEmailTemplate?.subject} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors" placeholder="Invoice {invoiceNumber} from {senderName}" />
                     </div>
                     <div>
                        <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 flex justify-between">
                          <span>Email Body</span>
                          <span className="text-zinc-600">Available vars: {'{clientName}'}, {'{invoiceNumber}'}, etc.</span>
                        </label>
                        <textarea name="body" required defaultValue={editEmailTemplate?.body} rows={8} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none focus:border-white/20 font-mono resize-y transition-colors" placeholder="Hi {clientName},\n\n..." />
                     </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                     <button type="button" onClick={() => setEmailTemplateModalOpen(false)} className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-white/60 hover:bg-[#141414] transition-colors">Cancel</button>
                     <button type="submit" className="bg-[var(--brand-primary)] text-white hover:bg-zinc-200 text-black px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center gap-2">Save Template</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {emailModalOpen && (
         <div className="fixed inset-0 bg-[#000000]/90 z-50 flex flex-col justify-center items-center p-10 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#0a0a0a] rounded-2xl p-10 border border-white/[0.04] relative z-[51]">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-body tracking-tight tracking-[0.02em] text-white uppercase flex items-center gap-2">
                    <Mail size={18} className="text-[var(--brandColor)]" /> Send Invoice
                 </h2>
                 <button onClick={() => setEmailModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                   <X size={20} />
                 </button>
               </div>
               
               <div className="mb-6 flex gap-2 items-end">
                  <div className="flex-1">
                     <div className="flex justify-between items-end mb-1">
                       <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 block">Quick Insert Template</label>
                       <button type="button" onClick={() => { setEditEmailTemplate(null); setEmailTemplateModalOpen(true); }} className="text-[10px] text-[var(--brandColor)] hover:text-white uppercase font-bold tracking-[0.2em] transition-colors flex items-center gap-1"><PlusCircle size={10} /> New Template</button>
                     </div>
                     <select 
                        value={selectedTemplateId}
                        onChange={(e) => {
                           const val = e.target.value;
                           setSelectedTemplateId(val);
                           const temp = emailTemplates.find(t => t.id === val);
                           if(temp) {
                              let sub = temp.subject || "";
                              let bod = temp.body || "";
                              const replaces = [
                                 {key:"{invoiceNumber}", val: livePreviewData?.invoiceNumber},
                                 {key:"{clientName}", val: livePreviewData?.clientName},
                                 {key:"{senderName}", val: livePreviewData?.senderName},
                                 {key:"{amount}", val: livePreviewData?.amount}
                              ];
                              replaces.forEach(v => {
                                 if(v.val !== undefined) {
                                   sub = sub.replace(new RegExp(v.key.replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&'), 'g'), String(v.val));
                                   bod = bod.replace(new RegExp(v.key.replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&'), 'g'), String(v.val));
                                 }
                              });
                              setEmailSubject(sub);
                              setEmailBody(bod);
                           }
                        }}
                        className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white/80 focus:outline-none focus:border-[var(--brandColor)] transition-colors appearance-none"
                     >
                        <option value="default">Select a template to use...</option>
                        {emailTemplates.map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                  </div>
                  {selectedTemplateId && selectedTemplateId !== "default" && (
                     <div className="flex gap-2">
                       <button onClick={() => { 
                          const temp = emailTemplates.find(t => t.id === selectedTemplateId);
                          if(temp) {
                             setEditEmailTemplate(temp); 
                             setEmailTemplateModalOpen(true); 
                          }
                       }} className="p-3 bg-[#000000] border border-white/[0.04] rounded hover:bg-[#141414] hover:text-white text-white/60 transition-colors" title="Edit Template">
                         <PenTool size={16} />
                       </button>
                       <button onClick={async () => {
                          if (confirm("Delete this template?")) {
                             try {
                               await deleteDoc(doc(db, "emailTemplates", selectedTemplateId));
                               setSelectedTemplateId("default");
                               toast.success("Template deleted");
                             } catch(err: any) {
                               handleFirestoreError(err, OperationType.DELETE, "emailTemplates");
                             }
                          }
                       }} className="p-3 bg-[#000000] border border-white/[0.04] rounded hover:bg-[var(--brand-primary)] hover:text-white text-zinc-100 transition-colors" title="Delete Template">
                         <Trash size={16} />
                       </button>
                     </div>
                  )}
               </div>
               
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 block">To:</label>
                     <input value={livePreviewData?.email || ""} readOnly className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none cursor-not-allowed opacity-50" />
                     {!livePreviewData?.email && <p className="text-xs text-[#FF453A] mt-1">Please enter an email in the invoice editor.</p>}
                  </div>
                  <div>
                     <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 block">Subject</label>
                     <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none focus:border-[var(--brandColor)] transition-colors" />
                  </div>
                  <div>
                     <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-1 block">Message</label>
                     <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} className="w-full bg-[#141414] border border-white/[0.04] rounded p-3 text-sm text-white focus:outline-none focus:border-[var(--brandColor)] font-mono resize-y transition-colors" />
                  </div>
               </div>
               
               <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.04]">
                  <div className="flex gap-2">
                     <span className="text-xs text-white/60 flex items-center gap-1.5"><Receipt size={14}/> Invoice PDF attached. </span>
                     {livePreviewData?.id && (
                       <button onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/?mode=invoice&id=${livePreviewData.id}`);
                          toast.success("Payment link copied!");
                       }} className="text-xs text-[var(--color-blue)] hover:text-white transition-colors flex items-center gap-1 underline underline-offset-4 font-mono font-bold tracking-[0.2em]"><Copy size={12}/> COPY LINK</button>
                     )}
                  </div>
                  <div className="flex gap-3">
                     <button type="button" onClick={() => setEmailModalOpen(false)} className="px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] text-white/60 hover:bg-[#141414] transition-colors">Cancel</button>
                     <button type="button" disabled={!livePreviewData?.email || isSendingEmail} onClick={async () => {
                        try {
                           setIsSendingEmail(true);
                           const res = await fetch('/api/send-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                 to: livePreviewData?.email,
                                 subject: emailSubject,
                                 html: emailBody.replace(/\n/g, '<br/>') + `<br/><br/><a href="${window.location.origin}/?mode=invoice&id=${livePreviewData?.id}">Pay Online</a>`
                              })
                           });
                           if (!res.ok) throw new Error(await res.text());
                           toast.success("Email sent successfully!");
                           setEmailModalOpen(false);
                        } catch (err: any) {
                           console.error(err);
                           toast.error("Failed to send email. Check API key settings.");
                        } finally {
                           setIsSendingEmail(false);
                        }
                     }} className="bg-[var(--brandColor)] text-white hover:opacity-80 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-opacity flex items-center gap-2 disabled:opacity-50">
                        {isSendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Email
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
      {/* PARTIAL PAYMENT MODAL */}
      {partialPaymentInvoice && (
         <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-white/[0.04] rounded-2xl p-10 lg:p-10 max-w-sm w-full relative shadow-2xl">
               <button onClick={() => { setPartialPaymentInvoice(null); setPartialPaymentAmount(''); }} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-2xl p-2">
                 <X size={16} />
               </button>
               <h3 className="text-xl font-bold font-body tracking-tight text-white mb-2 tracking-tight">Record Partial Payment</h3>
               <p className="text-xs text-white/60 mb-6 font-mono leading-relaxed">
                 Invoice Total: {getCurrencySymbol(partialPaymentInvoice.currency)}{Number(partialPaymentInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}<br/>
                 Amount Paid: {getCurrencySymbol(partialPaymentInvoice.currency)}{Number(partialPaymentInvoice.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}<br/>
                 Remaining: {getCurrencySymbol(partialPaymentInvoice.currency)}{Number(Number(partialPaymentInvoice.amount) - Number(partialPaymentInvoice.amountPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </p>
               <div className="space-y-4 mb-8">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-[0.2em] text-white/60 mb-2 block">Amount to Record</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <span className="text-white/60 sm:text-sm">{getCurrencySymbol(partialPaymentInvoice.currency)}</span>
                      </div>
                      <input 
                        type="number" 
                        value={partialPaymentAmount} 
                        onChange={e => setPartialPaymentAmount(e.target.value)}
                        placeholder="e.g. 500.00" 
                        className="w-full bg-[#000000]/50 border border-white/[0.04] rounded-2xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors" 
                      />
                    </div>
                  </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={() => { setPartialPaymentInvoice(null); setPartialPaymentAmount(''); }} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-colors font-mono">Cancel</button>
                 <button onClick={() => handleMarkInvoicePaid(partialPaymentInvoice, false)} disabled={!partialPaymentAmount} className="flex-1 px-4 py-3 bg-white/20 hover:bg-white/30 text-white/80 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 font-mono">
                    Record Payment
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* LEAD SOURCE MODAL FOR INVOICE GENERATION */}
      {leadModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#333] rounded-sm p-6 max-w-lg w-full relative shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText size={18} className="text-[#eab308]" /> Select Lead
              </h3>
              <button onClick={() => setLeadModalOpen(false)} className="text-white/50 hover:text-[#FF3B30] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {activeContracts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white/60 mb-4 font-mono text-xs uppercase tracking-widest">No active leads available.</p>
                <button onClick={() => setLeadModalOpen(false)} className="bg-[#eab308] text-black px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-sm">Close</button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {activeContracts.map((lead) => (
                  <button
                    key={lead.id}
                    className="w-full text-left bg-[#000000] border border-[#333] hover:border-[#eab308] p-4 group transition-colors rounded-sm flex justify-between items-center"
                    onClick={() => {
                      setSelectedLeadIdForInvoice(lead.id || null);
                      const nameEl = document.getElementById("standalone-clientName") as HTMLInputElement;
                      const amtEl = document.getElementById("standalone-amount") as HTMLInputElement;
                      const emailEl = document.getElementById("standalone-email") as HTMLInputElement;
                      const descEl = document.getElementById("standalone-desc") as HTMLInputElement;
                      
                      if (nameEl) nameEl.value = lead.brandName || lead.contactName || "";
                      if (amtEl) amtEl.value = lead.budget?.toString() || "";
                      if (emailEl) emailEl.value = lead.email || "";
                      if (descEl && lead.description) descEl.value = lead.description.substring(0, 50) + (lead.description.length > 50 ? "..." : "");
                      
                      const formEl = document.getElementById("standalone-invoice-form") as HTMLFormElement;
                      if (formEl) {
                         const event = new Event("change", { bubbles: true });
                         formEl.dispatchEvent(event);
                      }
                      
                      toast.success(`Loaded details for ${lead.brandName || lead.contactName}`);
                      setLeadModalOpen(false);
                      setIsStandaloneFormValid(formEl?.checkValidity());

                      setTimeout(() => {
                        document.getElementById("standalone-amount")?.focus();
                      }, 100);
                    }}
                  >
                    <div>
                      <div className="font-bold text-white mb-1 group-hover:text-[#eab308] transition-colors">{lead.brandName || lead.contactName || "Unnamed Lead"}</div>
                      <div className="text-xs text-white/50 font-mono flex items-center gap-2">
                        <span>{lead.email || "No Email"}</span>
                        <span>•</span>
                        <span className="text-[#34C759] font-bold">{lead.budget ? `$${lead.budget.toLocaleString()}` : "No budget"}</span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-white/20 group-hover:text-[#eab308] transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
