import { StockLedger, Product, Batch } from '@/lib/models';
import { Types } from 'mongoose';

// ============================================================================
// STOCK LEDGER SERVICE
// ============================================================================

export interface StockLedgerEntry {
  productId: string;
  warehouseId?: string;
  batchId?: string;
  entryType: 'inward' | 'outward' | 'adjustment' | 'waste' | 'return' | 'transfer';
  referenceType: 'purchase' | 'sales' | 'manual' | 'return_inward' | 'return_outward';
  referenceId: string;
  quantityChange: number;
  unitCost: number;
  notes?: string;
  createdByUserId: string;
  tenantId: string;
}

// ============================================================================
// SALE FLOW
// ============================================================================

export async function recordSale(
  tenantId: string,
  invoiceId: string,
  lineItems: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    batchId?: string;
  }>,
  createdByUserId: string,
  warehouseId?: string
): Promise<void> {
  const ledgerEntries: StockLedgerEntry[] = lineItems.map(item => ({
    productId: item.productId,
    warehouseId,
    batchId: item.batchId,
    entryType: 'outward',
    referenceType: 'sales',
    referenceId: invoiceId,
    quantityChange: -item.quantity, // Negative for outward
    unitCost: item.unitCost,
    createdByUserId,
    tenantId,
  }));
  
  // Record each ledger entry
  for (const entry of ledgerEntries) {
    await recordLedgerEntry(entry);
  }
}

// ============================================================================
// RETURN FLOW
// ============================================================================

export async function recordReturn(
  tenantId: string,
  originalInvoiceId: string,
  creditNoteId: string,
  lineItems: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    batchId?: string;
  }>,
  createdByUserId: string,
  warehouseId?: string,
  reason: string
): Promise<void> {
  const ledgerEntries: StockLedgerEntry[] = lineItems.map(item => ({
    productId: item.productId,
    warehouseId,
    batchId: item.batchId,
    entryType: 'return',
    referenceType: 'return_inward',
    referenceId: creditNoteId,
    quantityChange: item.quantity, // Positive for return (stock increase)
    unitCost: item.unitCost,
    notes: `Return from Invoice: ${originalInvoiceId}. Reason: ${reason}`,
    createdByUserId,
    tenantId,
  }));
  
  for (const entry of ledgerEntries) {
    await recordLedgerEntry(entry);
  }
}

// ============================================================================
// CANCELLATION FLOW
// ============================================================================

export async function recordCancellation(
  tenantId: string,
  invoiceId: string,
  createdByUserId: string
): Promise<void> {
  // Find original sale entries for this invoice
  const originalEntries = await StockLedger.find({
    tenantId,
    referenceId: invoiceId,
    entryType: 'outward',
  });
  
  // Create reversal entries
  for (const entry of originalEntries) {
    await recordLedgerEntry({
      productId: entry.productId,
      warehouseId: entry.warehouseId,
      batchId: entry.batchId,
      entryType: 'adjustment',
      referenceType: 'sales',
      referenceId: `${invoiceId}-cancelled`,
      quantityChange: -entry.quantityChange, // Reverse the original entry
      unitCost: entry.unitCost,
      notes: `Cancellation reversal of Invoice: ${invoiceId}`,
      createdByUserId,
      tenantId,
    });
  }
}

// ============================================================================
// PURCHASE INWARD FLOW
// ============================================================================

export async function recordPurchaseInward(
  tenantId: string,
  purchaseOrderId: string,
  lineItems: Array<{
    productId: string;
    batchId?: string;
    quantity: number;
    unitCost: number;
  }>,
  createdByUserId: string,
  warehouseId?: string
): Promise<void> {
  for (const item of lineItems) {
    await recordLedgerEntry({
      productId: item.productId,
      warehouseId,
      batchId: item.batchId,
      entryType: 'inward',
      referenceType: 'purchase',
      referenceId: purchaseOrderId,
      quantityChange: item.quantity,
      unitCost: item.unitCost,
      createdByUserId,
      tenantId,
    });
  }
}

// ============================================================================
// STOCK ADJUSTMENT FLOW
// ============================================================================

export async function recordAdjustment(
  tenantId: string,
  productId: string,
  warehouseId: string,
  quantityChange: number,
  reason: string,
  createdByUserId: string,
  unitCost?: number
): Promise<void> {
  // Get latest unit cost if not provided
  let finalUnitCost = unitCost;
  if (!finalUnitCost) {
    const latestEntry = await StockLedger.findOne(
      { tenantId, productId, warehouseId },
      {},
      { sort: { createdAt: -1 } }
    );
    finalUnitCost = latestEntry?.unitCost || 0;
  }
  
  await recordLedgerEntry({
    productId,
    warehouseId,
    entryType: 'adjustment',
    referenceType: 'manual',
    referenceId: `ADJ-${Date.now()}`,
    quantityChange,
    unitCost: finalUnitCost,
    notes: reason,
    createdByUserId,
    tenantId,
  });
}

// ============================================================================
// WASTE/EXPIRY FLOW
// ============================================================================

export async function recordWaste(
  tenantId: string,
  batchId: string,
  quantity: number,
  createdByUserId: string,
  reason: string
): Promise<void> {
  // Find batch to get product ID and warehouse info
  const batch = await Batch.findById(batchId);
  if (!batch) throw new Error('Batch not found');
  
  // Get latest unit cost from ledger
  const latestEntry = await StockLedger.findOne(
    { tenantId, batchId },
    {},
    { sort: { createdAt: -1 } }
  );
  
  await recordLedgerEntry({
    productId: batch.productId,
    batchId,
    entryType: 'waste',
    referenceType: 'manual',
    referenceId: `WASTE-${Date.now()}`,
    quantityChange: -quantity, // Negative for waste
    unitCost: latestEntry?.unitCost || batch.unitCost,
    notes: `Waste: ${reason}`,
    createdByUserId,
    tenantId,
  });
}

// ============================================================================
// CORE LEDGER RECORDING
// ============================================================================

async function recordLedgerEntry(entry: StockLedgerEntry): Promise<void> {
  // Get current balance
  const previousEntry = await StockLedger.findOne(
    { tenantId: entry.tenantId, productId: entry.productId, warehouseId: entry.warehouseId, batchId: entry.batchId },
    {},
    { sort: { createdAt: -1 } }
  );
  
  const balanceQuantity = (previousEntry?.balanceQuantity || 0) + entry.quantityChange;
  
  // Prevent negative stock for outward transactions
  if (entry.entryType === 'outward' && balanceQuantity < 0) {
    throw new Error(`Insufficient stock. Current balance: ${previousEntry?.balanceQuantity || 0}, trying to remove: ${Math.abs(entry.quantityChange)}`);
  }
  
  // Create ledger entry
  const newEntry = new StockLedger({
    _id: new Types.ObjectId(),
    tenantId: entry.tenantId,
    productId: entry.productId,
    warehouseId: entry.warehouseId,
    batchId: entry.batchId,
    entryType: entry.entryType,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    quantityChange: entry.quantityChange,
    balanceQuantity,
    unitCost: entry.unitCost,
    totalValue: entry.quantityChange * entry.unitCost,
    notes: entry.notes,
    createdByUserId: entry.createdByUserId,
  });
  
  await newEntry.save();
}

// ============================================================================
// STOCK QUERIES
// ============================================================================

export async function getCurrentStock(
  tenantId: string,
  productId: string,
  warehouseId?: string,
  batchId?: string
): Promise<{
  productId: string;
  quantity: number;
  value: number;
  unitCost: number;
  lastMovement: Date | null;
}> {
  const query: any = { tenantId, productId };
  if (warehouseId) query.warehouseId = warehouseId;
  if (batchId) query.batchId = batchId;
  
  const latestEntry = await StockLedger.findOne(query, {}, { sort: { createdAt: -1 } });
  
  return {
    productId,
    quantity: latestEntry?.balanceQuantity || 0,
    value: latestEntry ? latestEntry.balanceQuantity * latestEntry.unitCost : 0,
    unitCost: latestEntry?.unitCost || 0,
    lastMovement: latestEntry?.createdAt || null,
  };
}

export async function getStockByWarehouse(
  tenantId: string,
  warehouseId: string
): Promise<Array<{
  productId: string;
  quantity: number;
  value: number;
  lastMovement: Date;
}>> {
  const entries = await StockLedger.find(
    { tenantId, warehouseId },
    {},
    { sort: { productId: 1, createdAt: -1 } }
  ).lean();
  
  const stock: Record<string, any> = {};
  
  for (const entry of entries) {
    const key = entry.productId;
    if (!stock[key]) {
      stock[key] = {
        productId: entry.productId,
        quantity: entry.balanceQuantity,
        value: entry.balanceQuantity * entry.unitCost,
        lastMovement: entry.createdAt,
      };
    }
  }
  
  return Object.values(stock);
}

export async function getStockLedgerHistory(
  tenantId: string,
  productId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{
  entries: any[];
  total: number;
}> {
  const entries = await StockLedger.find(
    { tenantId, productId },
    {},
    { sort: { createdAt: -1 }, limit, skip: offset }
  ).lean();
  
  const total = await StockLedger.countDocuments({ tenantId, productId });
  
  return { entries, total };
}

export async function getExpiringBatches(
  tenantId: string,
  daysUntilExpiry: number = 30
): Promise<Array<{
  batchId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  daysRemaining: number;
}>> {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);
  
  const batches = await Batch.find({
    tenantId,
    expiryDate: { $lte: expiryThreshold, $gte: new Date() },
  }).populate('productId', 'name').lean();
  
  const result = [];
  
  for (const batch of batches) {
    const stock = await getCurrentStock(tenantId, batch.productId, undefined, batch._id);
    
    if (stock.quantity > 0) {
      const daysRemaining = Math.ceil(
        (batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      result.push({
        batchId: batch._id,
        productId: batch.productId,
        productName: (batch as any).productId?.name || '',
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: stock.quantity,
        daysRemaining,
      });
    }
  }
  
  return result.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export async function getLowStockAlerts(
  tenantId: string
): Promise<Array<{
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQty: number;
  status: 'low' | 'critical';
}>> {
  const products = await Product.find({ tenantId, trackInventory: true }).lean();
  
  const alerts = [];
  
  for (const product of products) {
    const stock = await getCurrentStock(tenantId, product._id);
    
    if (stock.quantity <= product.reorderPoint) {
      alerts.push({
        productId: product._id,
        productName: product.name,
        currentStock: stock.quantity,
        reorderPoint: product.reorderPoint,
        reorderQty: product.reorderQty,
        status: stock.quantity === 0 ? 'critical' : 'low',
      });
    }
  }
  
  return alerts.sort((a, b) => a.currentStock - b.currentStock);
}

export async function getInventoryValuation(
  tenantId: string,
  method: 'fifo' | 'lifo' | 'wac' = 'wac' // WAC = Weighted Average Cost
): Promise<{
  totalItems: number;
  totalValue: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    value: number;
    avgCost: number;
  }>;
}> {
  const products = await Product.find({ tenantId }).lean();
  
  let totalItems = 0;
  let totalValue = 0;
  const byProduct = [];
  
  for (const product of products) {
    const stock = await getCurrentStock(tenantId, product._id);
    
    totalItems += stock.quantity;
    totalValue += stock.value;
    
    byProduct.push({
      productId: product._id,
      productName: product.name,
      quantity: stock.quantity,
      value: stock.value,
      avgCost: stock.unitCost,
    });
  }
  
  return {
    totalItems,
    totalValue,
    byProduct: byProduct.sort((a, b) => b.value - a.value),
  };
}
