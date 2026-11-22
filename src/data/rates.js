// Fuel prices reflect the Cambodia Ministry of Commerce schedule effective 11–21 Nov 2026.
// Pure EVs use the DC tariff; PHEVs use the AC/grid tariff. Both are editable in-app.
export const defaultRates = {
  gasoline: 4350,
  diesel: 5300,
  ev: 1350,
  phevAc: 609,
  usdToKhr: 4050,
  gasolineLabel: 'Regular gasoline (EA92)',
  dieselLabel: 'Diesel (10ppm)',
  evLabel: 'EV DC fast charging',
  phevAcLabel: 'PHEV AC / grid charging'
}

export const fuelPricesApiUrl = 'https://data.mef.gov.kh/api/v1/public-datasets/pd_681d89b4dbc953000126f5e7/json?page=1&page_size=100'
export const exchangeRateApiUrl = 'https://data.mef.gov.kh/api/v1/realtime-api/exchange-rate?currency_id=USD'

const rowsFrom = payload => {
  if (Array.isArray(payload)) return payload
  for (const key of ['data', 'results', 'records', 'items']) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  return []
}

const numericPrice = value => {
  const number = Number(String(value ?? '').replace(/[ ,៛]/g, ''))
  return Number.isFinite(number) && number >= 500 ? number : null
}

// The portal's column descriptions identify the *_Change fields as the
// retail price; the unsuffixed fields contain the change from the prior period.
const retailPrice = (row, column) => numericPrice(row?.[`${column}_Change`]) || numericPrice(row?.[column])

export async function fetchLatestFuelPrices(signal) {
  const response = await fetch(fuelPricesApiUrl, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Fuel price API returned ${response.status}`)
  const rows = rowsFrom(await response.json())
  const latest = rows
    .filter(row => row?.Start_Date)
    .sort((a, b) => String(b.Start_Date).localeCompare(String(a.Start_Date)))
    .find(row => retailPrice(row, 'Gasoline_92_Unit_Price') && retailPrice(row, 'Gasoil_50ppm_Unit_Price'))
  if (!latest) throw new Error('No valid fuel price records were returned')

  return {
    gasoline: retailPrice(latest, 'Gasoline_92_Unit_Price'),
    diesel: retailPrice(latest, 'Gasoil_50ppm_Unit_Price'),
    startDate: latest.Start_Date,
    endDate: latest.End_Date || '',
    sourceUrl: latest.Source_Link || ''
  }
}

export async function fetchLatestExchangeRate(signal) {
  const response = await fetch(exchangeRateApiUrl, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Exchange rate API returned ${response.status}`)
  const payload = await response.json()
  const rate = Number(payload?.data?.average)
  if (!Number.isFinite(rate) || rate <= 0 || !payload?.data?.valid_date) {
    throw new Error('No valid USD exchange rate was returned')
  }
  return { rate, validDate: payload.data.valid_date }
}
