drop table if exists company_data;
create table company_data (
    unternehmensname text not null,
    zusatz text,
    adresszeile1 text not null,
    adresszeile2 text,
    plz text not null,
    ort text not null,
    steuernummer text,
    umsatzsteuerId text,
    direktorTitel text,
    direktorName text,
    bearbeitet text not null,

    check (length(plz) = 5 and plz glob '[0-9][0-9][0-9][0-9][0-9]')
);

drop table if exists mandanten;
create table mandanten (
    id TEXT PRIMARY KEY NOT NULL,
    mandantName text not null,
    zusatz text,
    adresszeile1 text,
    adresszeile2 text,
    plz text not null,
    ort text not null,
    verwaltungsart text not null,
    wirtschaftsjahrBeginn text not null,
    wirtschaftsjahrEnde text not null,
    aktuellesWirtschaftsjahr text,
    summeOffenerPosten number,
    bearbeitet text not null,
    
    check (verwaltungsart in ('WEG', 'Mietverwaltung', 'Sondereigentum')),
    check (length(plz) = 5 and plz glob '[0-9][0-9][0-9][0-9][0-9]')
    check (length(aktuellesWirtschaftsjahr) = 4 or aktuellesWirtschaftsjahr=null)
);