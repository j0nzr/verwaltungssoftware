type accountType = "Asset" | "Equity" | "Liabilities" | "Earnings" | "Expenses";

class Konto {
    private name: string;
    private kontoTyp: accountType;
    private kontoNummer: string;
    private unterkontoVon?: Konto;
    private umlagefaehig: boolean = false;

    constructor(name: string, kTyp: accountType, kontoNummer: string, uKontoVon?: Konto, umlagefaehig?: boolean) {
        this.name = name;
        this.kontoTyp = kTyp;
        this.kontoNummer = kontoNummer;

        if (uKontoVon) {
            this.unterkontoVon = uKontoVon;
        }
        if(umlagefaehig) {
            this.umlagefaehig = umlagefaehig
        }
    }

    public getName(): string {
        return this.name;
    }

    public getKontoTyp(): accountType {
        return this.kontoTyp;
    }

    public getUmlagefaehig(): boolean {
        return this.umlagefaehig;
    }

    public getUeberkonto(): Konto | void {
        if(this.unterkontoVon) {
            return this.unterkontoVon
        }
    }

    public getKontonummer(): string {
        return this.kontoNummer
    }
}

type split = {
    konto: Konto,
    betrag: number,
    verteilungsrelevant: boolean
}

class Buchung {
    private sollKonten: split[];
    private habenKonten: split[];
    private buchungsDatum: Date;
    private eingabeDatum: Date;
    private beschreibung: string = "";

    constructor (buchungsDatum: Date, sKonto?: split, hKonto?: split) {
        this.buchungsDatum = buchungsDatum;
        this.eingabeDatum = new Date(Date.now());
        if(sKonto) {
            this.sollKonten = [sKonto];
        }
        if(hKonto) {
            this.habenKonten = [hKonto];
        }
        this.sollKonten = [];
        this.habenKonten = [];
    }

    getSollKonten(): split[] {
        return this.sollKonten
    }

    getHabenKonten(): split[] {
        return this.habenKonten
    }

    getBuchungsdatum(): Date {
        return this.buchungsDatum
    }

    getEingabedatum(): Date {
        return this.eingabeDatum
    }

    getBeschreibung(): string {
        return this.beschreibung
    }

    soll(sKonto: split, ...sKonten: split[]): Buchung {
        if (this.sollKonten) {
            this.sollKonten = [...this.sollKonten, sKonto, ...sKonten];
            return this
        }
        this.sollKonten = [...this.sollKonten, sKonto];
        return this;
    }

    haben(hKonto: split, ...hKonten: split[]): Buchung {
        if (this.habenKonten) {
            this.habenKonten = [...this.habenKonten, hKonto, ...hKonten];
            return this
        }
        this.habenKonten = [...this.habenKonten, hKonto];
        return this;
    }

    check(): boolean {
        let checksum = 0
        this.sollKonten.forEach((s: split) => {
            checksum += s.betrag
        });
        this.habenKonten.forEach((s: split) => {
            checksum -= s.betrag
        });

        return checksum == 0
    }

}