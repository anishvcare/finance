import React, { useMemo } from 'react';
import { Country, State } from 'country-state-city';

interface Props {
    country: string;
    state: string;
    onCountryChange: (value: string) => void;
    onStateChange: (value: string) => void;
    countryLabel?: string;
    stateLabel?: string;
}

/**
 * Renders two form fields (Country dropdown + State dropdown).
 * Values are stored as full names (matching the database columns).
 * The State field shows a dropdown when the selected country has states,
 * otherwise falls back to a free-text input.
 */
export default function CountryStateSelect({
    country, state, onCountryChange, onStateChange,
    countryLabel = 'Country', stateLabel = 'State',
}: Props) {
    const countries = useMemo(() => Country.getAllCountries(), []);
    const selectedCountry = useMemo(
        () => countries.find(c => c.name === country),
        [countries, country]
    );
    const states = useMemo(
        () => (selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []),
        [selectedCountry]
    );

    return (
        <>
            <div>
                <label className="label">{countryLabel}</label>
                <select
                    className="input"
                    value={country}
                    onChange={(e) => { onCountryChange(e.target.value); onStateChange(''); }}
                >
                    <option value="">Select country...</option>
                    {countries.map(c => (
                        <option key={c.isoCode} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="label">{stateLabel}</label>
                {states.length > 0 ? (
                    <select className="input" value={state} onChange={(e) => onStateChange(e.target.value)}>
                        <option value="">Select state...</option>
                        {states.map(s => (
                            <option key={s.isoCode} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        className="input"
                        value={state}
                        onChange={(e) => onStateChange(e.target.value)}
                        placeholder="State / Province"
                    />
                )}
            </div>
        </>
    );
}
