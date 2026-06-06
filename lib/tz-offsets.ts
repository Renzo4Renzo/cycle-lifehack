export interface TzOffset {
  minutes: number
  label: string
  cities: string
}

export const TZ_OFFSETS: TzOffset[] = [
  { minutes: -720, label: "UTC-12:00", cities: "Baker Island" },
  { minutes: -660, label: "UTC-11:00", cities: "Niue, Pago Pago" },
  { minutes: -600, label: "UTC-10:00", cities: "Honolulu, Tahiti, Rarotonga" },
  { minutes: -570, label: "UTC-9:30",  cities: "Marquesas Islands" },
  { minutes: -540, label: "UTC-9:00",  cities: "Anchorage, Juneau" },
  { minutes: -480, label: "UTC-8:00",  cities: "Los Angeles, Vancouver, Tijuana" },
  { minutes: -420, label: "UTC-7:00",  cities: "Denver, Phoenix, Calgary" },
  { minutes: -360, label: "UTC-6:00",  cities: "Chicago, Mexico City, San José" },
  { minutes: -300, label: "UTC-5:00",  cities: "New York, Lima, Bogotá, Toronto" },
  { minutes: -240, label: "UTC-4:00",  cities: "Santiago, Caracas, La Paz, Halifax" },
  { minutes: -210, label: "UTC-3:30",  cities: "St. John's" },
  { minutes: -180, label: "UTC-3:00",  cities: "Buenos Aires, São Paulo, Montevideo" },
  { minutes: -120, label: "UTC-2:00",  cities: "South Georgia" },
  { minutes:  -60, label: "UTC-1:00",  cities: "Azores, Praia" },
  { minutes:    0, label: "UTC+0:00",  cities: "London, Dublin, Lisbon, Reykjavik" },
  { minutes:   60, label: "UTC+1:00",  cities: "Paris, Berlin, Rome, Madrid, Lagos" },
  { minutes:  120, label: "UTC+2:00",  cities: "Cairo, Athens, Helsinki, Johannesburg" },
  { minutes:  180, label: "UTC+3:00",  cities: "Moscow, Istanbul, Nairobi, Riyadh" },
  { minutes:  210, label: "UTC+3:30",  cities: "Tehran" },
  { minutes:  240, label: "UTC+4:00",  cities: "Dubai, Baku, Tbilisi" },
  { minutes:  270, label: "UTC+4:30",  cities: "Kabul" },
  { minutes:  300, label: "UTC+5:00",  cities: "Karachi, Tashkent" },
  { minutes:  330, label: "UTC+5:30",  cities: "Mumbai, New Delhi, Colombo" },
  { minutes:  345, label: "UTC+5:45",  cities: "Kathmandu" },
  { minutes:  360, label: "UTC+6:00",  cities: "Dhaka, Almaty" },
  { minutes:  390, label: "UTC+6:30",  cities: "Yangon" },
  { minutes:  420, label: "UTC+7:00",  cities: "Bangkok, Jakarta, Ho Chi Minh City" },
  { minutes:  480, label: "UTC+8:00",  cities: "Beijing, Singapore, Hong Kong, Manila" },
  { minutes:  525, label: "UTC+8:45",  cities: "Eucla" },
  { minutes:  540, label: "UTC+9:00",  cities: "Tokyo, Seoul" },
  { minutes:  570, label: "UTC+9:30",  cities: "Adelaide, Darwin" },
  { minutes:  600, label: "UTC+10:00", cities: "Sydney, Melbourne, Brisbane" },
  { minutes:  630, label: "UTC+10:30", cities: "Lord Howe Island" },
  { minutes:  660, label: "UTC+11:00", cities: "Honiara, Nouméa" },
  { minutes:  720, label: "UTC+12:00", cities: "Auckland, Suva" },
  { minutes:  765, label: "UTC+12:45", cities: "Chatham Islands" },
  { minutes:  780, label: "UTC+13:00", cities: "Apia, Nuku'alofa" },
  { minutes:  840, label: "UTC+14:00", cities: "Kiritimati" },
]

export function formatOffsetLabel(minutes: number): string {
  const tz = TZ_OFFSETS.find((t) => t.minutes === minutes)
  return tz ? `${tz.label} — ${tz.cities}` : `UTC${minutes >= 0 ? "+" : ""}${minutes / 60}:00`
}
