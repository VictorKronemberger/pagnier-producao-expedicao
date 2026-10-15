import type {Shipment,ShippingOP} from "./shipping.mjs";
export function packingWorkbook(shipment:Shipment,ops:ShippingOP[]):Promise<import("exceljs").Workbook>;
export function packingExcelBlob(shipment:Shipment,ops:ShippingOP[]):Promise<Blob>;
