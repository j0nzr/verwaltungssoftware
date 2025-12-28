export interface companyData {
    unternehmensname: string,
    zusatz?: string,
    adresszeile1: string,
    adresszeile2?: string,
    plz: string,
    ort: string,
    steuernummer?: string,
    umsatzsteuerId?: string,
    direktorTitel?: string,
    direktorName?: string,
    bearbeitet: string
};

export interface mandant {
    id: string,
    mandantName: string,
    zusatz?: string,
    adresszeile1?: string,
    adresszeile2?: string,
    plz: string,
    ort: string,
    verwaltungsart: 'WEG' | 'Mietverwaltung' | 'Sondereigentum',
    wirtschaftsjahrBeginn: string,
    wirtschaftsjahrEnde: string
}