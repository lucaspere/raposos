import { Client } from 'pg';

export async function fetchSpotPrice(): Promise<number> {
    // Mock oracle price
    return 5.00; 
}

export async function recordTaxEvent(
    dbClient: Client, 
    transactionId: string, 
    eventType: 'ACQUISITION' | 'DISPOSAL', 
    tokenAmount: number,
    costBasisValue?: number
) {
    const spotPrice = await fetchSpotPrice();
    const totalBrlValue = tokenAmount * spotPrice;
    
    let capitalGain = null;
    if (eventType === 'DISPOSAL' && costBasisValue) {
        capitalGain = totalBrlValue - costBasisValue;
    }

    await dbClient.query(`
        INSERT INTO tax_records (transaction_id, event_type, token_amount, brl_exchange_rate, total_brl_value, capital_gain)
        VALUES ($1, $2, $3, $4, $5, $6)
    `, [transactionId, eventType, tokenAmount, spotPrice, totalBrlValue, capitalGain]);
}
