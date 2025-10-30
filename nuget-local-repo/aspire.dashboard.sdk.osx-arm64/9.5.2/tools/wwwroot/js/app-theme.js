import {
    accentBaseColor,
    baseLayerLuminance,
    SwatchRGB,
    fillColor,
    neutralLayerL2,
    neutralPalette,
    DesignToken,
    neutralFillLayerRestDelta
} from "/_content/Microsoft.FluentUI.AspNetCore.Components/Microsoft.FluentUI.AspNetCore.Components.lib.module.js";

const currentThemeCookieName = "currentTheme";
const themeSettingDark = "Dark";
const themeSettingLight = "Light";
const darkThemeLuminance = 0.19;
const lightThemeLuminance = 1.0;
const darknessLuminanceTarget = (-0.1 + Math.sqrt(0.21)) / 2;

/**
 * Updates the current theme on the site based on the specified theme
 * @param {string} specifiedTheme
 */
export function updateTheme(specifiedTheme) {
    const effectiveTheme = getEffectiveTheme(specifiedTheme);

    applyTheme(effectiveTheme);
    setThemeCookie(specifiedTheme);

    return effectiveTheme;
}

/**
 * Returns the value of the currentTheme cookie.
 * @returns {string}
 */
export function getThemeCookieValue() {
    return getCookieValue(currentThemeCookieName);
}

export function getCurrentTheme() {
    return getEffectiveTheme(getThemeCookieValue());
}

/**
 * Returns the current system theme (Light or Dark)
 * @returns {string}
 */
function getSystemTheme() {
    let matched = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (matched) {
        return themeSettingDark;
    } else {
        return themeSettingLight;
    }
}

/**
 * Sets the currentTheme cookie to the specified value.
 * @param {string} theme
 */
function setThemeCookie(theme) {
    if (theme == themeSettingDark || theme == themeSettingLight) {
        // Cookie will expire after 1 year. Using a much larger value won't have an impact because
        // Chrome limits expiration to 400 days: https://developer.chrome.com/blog/cookie-max-age-expires
        // The cookie is reset when the dashboard loads to creating a sliding expiration.
        document.cookie = `${currentThemeCookieName}=${theme}; Path=/; expires=${new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 365).toGMTString()}`;
    } else {
        // Delete cookie for other values (e.g. System)
        document.cookie = `${currentThemeCookieName}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    }
}

/**
 * Sets the document data-theme attribute to the specified value.
 * @param {string} theme The theme to set. Should be Light or Dark.
 */
function setThemeOnDocument(theme) {

    if (theme === themeSettingDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else /* Light */ {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

/**
 *
 * @param {string} theme The theme to use. Should be Light or Dark.
 */
function setBaseLayerLuminance(theme) {
    const baseLayerLuminanceValue = getBaseLayerLuminanceForTheme(theme);
    baseLayerLuminance.withDefault(baseLayerLuminanceValue);
}

/**
 * Returns the value of the specified cookie, or the empty string if the cookie is not present
 * @param {string} cookieName
 * @returns {string}
 */
function getCookieValue(cookieName) {
    const cookiePieces = document.cookie.split(';');
    for (let index = 0; index < cookiePieces.length; index++) {
        if (cookiePieces[index].trim().startsWith(cookieName)) {
            const cookieKeyValue = cookiePieces[index].split('=');
            if (cookieKeyValue.length > 1) {
                return cookieKeyValue[1];
            }
        }
    }

    return "";
}

/**
 * Converts a setting value for the theme (Light, Dark, System or null/empty) into the effective theme that should be applied
 * @param {string} specifiedTheme The setting value to use to determine the effective theme. Anything other than Light or Dark will be treated as System
 * @returns {string} The actual theme to use based on the supplied setting. Will be either Light or Dark.
 */
function getEffectiveTheme(specifiedTheme) {
    if (specifiedTheme === themeSettingLight ||
        specifiedTheme === themeSettingDark) {
        return specifiedTheme;
    } else {
        return getSystemTheme();
    }
}

/**
 *
 * @param {string} theme The theme to use. Should be Light or Dark
 * @returns {string}
 */
function getBaseLayerLuminanceForTheme(theme) {
    if (theme === themeSettingDark) {
        return darkThemeLuminance;
    } else /* Light */ {
        return lightThemeLuminance;
    }
}

/**
 * Configures the accent color palette based on the .NET purple
 */
function setAccentColor() {
    // Convert the base color ourselves to avoid pulling in the
    // @microsoft/fast-colors library just for one call to parseColorHexRGB
    const baseColor = { // #512BD4
        r: 0x51 / 255.0,
        g: 0x2B / 255.0,
        b: 0xD4 / 255.0
    };

    const accentBase = SwatchRGB.create(baseColor.r, baseColor.g, baseColor.b);
    accentBaseColor.withDefault(accentBase);
}

/**
 * Configures the default background color to use for the body
 */
function setFillColor() {
    // Design specs say we should use --neutral-layer-2 as the fill color
    // for the body. Most of the web components use --fill-color as their
    // background color, so we need to make sure they get --neutral-layer-2
    // when they request --fill-color.
    fillColor.setValueFor(document.body, neutralLayerL2);
}

/**
 * Applies the Light or Dark theme to the entire site
 * @param {string} theme The theme to use. Should be Light or Dark
 */
function applyTheme(theme) {
    setBaseLayerLuminance(theme);
    setAccentColor();
    setFillColor();
    setThemeOnDocument(theme);
}

/**
 *
 * @param {Palette} palette
 * @param {number} baseLayerLuminance
 * @returns {number}
 */
function neutralLayer1Index(palette, baseLayerLuminance) {
    return palette.closestIndexOf(SwatchRGB.create(baseLayerLuminance, baseLayerLuminance, baseLayerLuminance));
}

/**
 *
 * @param {Palette} palette
 * @param {Swatch} reference
 * @param {number} baseLayerLuminance
 * @param {number} layerDelta
 * @param {number} hoverDeltaLight
 * @param {number} hoverDeltaDark
 * @returns {Swatch}
 */
function neutralLayerHoverAlgorithm(palette, reference, baseLayerLuminance, layerDelta, hoverDeltaLight, hoverDeltaDark) {
    const baseIndex = neutralLayer1Index(palette, baseLayerLuminance);
    // Determine both the size of the delta (from the value passed in) and the direction (if the current color is dark,
    // the hover color will be a lower index (lighter); if the current color is light, the hover color will be a higher index (darker))
    const hoverDelta = isDark(reference) ? hoverDeltaDark * -1 : hoverDeltaLight;
    return palette.get(baseIndex + (layerDelta * -1) + hoverDelta);
}

/**
 *
 * @param {Swatch} color
 * @returns {boolean}
 */
function isDark(color) {
    return color.relativeLuminance <= darknessLuminanceTarget;
}

/**
 * Creates additional design tokens that are used to define the hover colors for the neutral layers
 * used in the site theme (neutral-layer-1 and neutral-layer-2, specifically). Unlike other -hover
 * variants, these are not created by the design system by default so we need to create them ourselves.
 * This is a lightly tweaked variant of other hover recipes used in the design system.
 */
function createAdditionalDesignTokens() {
    const neutralLayer1HoverLightDelta = DesignToken.create({ name: 'neutral-layer-1-hover-light-delta', cssCustomPropertyName: null }).withDefault(3);
    const neutralLayer1HoverDarkDelta = DesignToken.create({ name: 'neutral-layer-1-hover-dark-delta', cssCustomPropertyName: null }).withDefault(2);
    const neutralLayer2HoverLightDelta = DesignToken.create({ name: 'neutral-layer-2-hover-light-delta', cssCustomPropertyName: null }).withDefault(2);
    const neutralLayer2HoverDarkDelta = DesignToken.create({ name: 'neutral-layer-2-hover-dark-delta', cssCustomPropertyName: null }).withDefault(2);

    const neutralLayer1HoverRecipe = DesignToken.create({ name: 'neutral-layer-1-hover-recipe', cssCustomPropertyName: null }).withDefault({
        evaluate: (element, reference) =>
            neutralLayerHoverAlgorithm(
                neutralPalette.getValueFor(element),
                reference || fillColor.getValueFor(element),
                baseLayerLuminance.getValueFor(element),
                0, // No layer delta since this is for neutral-layer-1
                neutralLayer1HoverLightDelta.getValueFor(element),
                neutralLayer1HoverDarkDelta.getValueFor(element)
            ),
    });

    const neutralLayer2HoverRecipe = DesignToken.create({ name: 'neutral-layer-2-hover-recipe', cssCustomPropertyName: null }).withDefault({
        evaluate: (element, reference) =>
            neutralLayerHoverAlgorithm(
                neutralPalette.getValueFor(element),
                reference || fillColor.getValueFor(element),
                baseLayerLuminance.getValueFor(element),
                // Use the same layer delta used by the base recipe to calculate layer 2
                neutralFillLayerRestDelta.getValueFor(element),
                neutralLayer2HoverLightDelta.getValueFor(element),
                neutralLayer2HoverDarkDelta.getValueFor(element)
            ),
    });

    // Creates the --neutral-layer-1-hover custom CSS property
    DesignToken.create('neutral-layer-1-hover').withDefault((element) =>
        neutralLayer1HoverRecipe.getValueFor(element).evaluate(element),
    );

    // Creates the --neutral-layer-2-hover custom CSS property
    DesignToken.create('neutral-layer-2-hover').withDefault((element) =>
        neutralLayer2HoverRecipe.getValueFor(element).evaluate(element),
    );
}

function initializeTheme() {
    const themeCookieValue = getThemeCookieValue();
    const effectiveTheme = getEffectiveTheme(themeCookieValue);

    applyTheme(effectiveTheme);

    // If a theme cookie has been set then set it again on page load.
    // This updates the cookie expiration date and creates a sliding expiration.
    if (themeCookieValue) {
        setThemeCookie(themeCookieValue);
    }
}

createAdditionalDesignTokens();
initializeTheme();

// SIG // Begin signature block
// SIG // MIIpMAYJKoZIhvcNAQcCoIIpITCCKR0CAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // H62Soy6hZVgzSGaIDoEyXA7yxRSCf/pqy3RBS9anIlyg
// SIG // gg3lMIIGYzCCBEugAwIBAgITMwAABKx2L/5u0oyEaAAA
// SIG // AAAErDANBgkqhkiG9w0BAQwFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI1MDkxODE3NTg1OVoX
// SIG // DTI2MDcwNjE3NTg1OVowYzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjENMAsGA1UEAxMELk5FVDCCAaIwDQYJKoZIhvcNAQEB
// SIG // BQADggGPADCCAYoCggGBALuFEy75KfVcG2h5jV0iKaYZ
// SIG // VCj66T6iHA4wmiIfEEj395MLfCL0DzfllnBDCG6IYYOB
// SIG // x6S2NQWioqOnxW5sVtKAV/XFEo9jUPdD3KrjYaSJ2RmD
// SIG // VaG7DfqYuFYGaAoiOu8S2AABRVOJDBXccisvpm7Rj6eU
// SIG // N7KAhkhMIpCYr3g4e8DyUY4oD+XeEavEOTNM+u+zrq/u
// SIG // 2hBfE5lUFuPLX6q5/Mfvd5b3rBCQe55Cw0Cr5sxjkcnZ
// SIG // asgg6NpWaAXzi/fZYMVvZKQMbpvBUVl7e38xtQbjn+0j
// SIG // Pxg8EZDQVpDsnuIX00BwJuVqPJ/+fsTyGiXc4UjVZjFP
// SIG // fAZAzyQQzUiZz3hcoj63M4oc5Ppwa24Xo/h3d5LNl8Wc
// SIG // duJ5zB6B1JdcW8nnX2OTKJV7RkEufA8z1/VdSuet3LYK
// SIG // qvUDls+twfp6+Pp7gKK5PVV+NmxM1CwsJrVExkL0Atry
// SIG // AoCEk33xKV4YDdhJkfyEWOe4XfKX8SdoIiWjzc2Ji4h0
// SIG // GKMMnQIDAQABo4IBczCCAW8wHwYDVR0lBBgwFgYKKwYB
// SIG // BAGCN0wIAQYIKwYBBQUHAwMwHQYDVR0OBBYEFLt6EqlH
// SIG // MQADV5J7JQApJK7bkFLXMEUGA1UdEQQ+MDykOjA4MR4w
// SIG // HAYDVQQLExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xFjAU
// SIG // BgNVBAUTDTQ2NDIyMys1MDYwODEwHwYDVR0jBBgwFoAU
// SIG // SG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0wSzBJ
// SIG // oEegRYZDaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3Br
// SIG // aW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3
// SIG // LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYBBQUH
// SIG // MAKGRWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lv
// SIG // cHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8yMDExLTA3
// SIG // LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEB
// SIG // DAUAA4ICAQBZqC3dc2aDYyQyTf7Rd+JF0U4aF6+ry5PT
// SIG // FMP3q9NQxswxYjWkDaA+YQuOCHXFvneBMFKiDrsV26QJ
// SIG // fDoraWOmIqQAqBUxKmCY+94Yhq2HtQqvnbdCwrKBwbzu
// SIG // Uiyb33D60UBFuqifb6bVTiyo95MYu5GcuYj9jcAmegGg
// SIG // sshKDL0HS6GyDG5iBNiFtdOCm8Q3PiCwLkU+gP8qeke5
// SIG // McDHjvR/L3KBdcWPhEpG/HEK6RG9Q75JZAtQguX8iiZi
// SIG // G9Ei+yt/iiVBnuaiDjEOfi8x+tmN0teAwvzpj2xPjTAS
// SIG // tEUCSjCZWmFKkxsrYmNpNQtG3CttnHxWzinAuqbogvSr
// SIG // 5H4MtirS3R2gZQoVly+7S4h5jvf7MyH810Q9wy7hhBLm
// SIG // C+whhg3WmAoBUvDzBKM9f4TJZvSzxlq2KlhR1i+x91PO
// SIG // B4FW+YPTrKlJ4vaClHJGKOGNbH9M8ktR8Yh5o1CFRrce
// SIG // NiQ+LjAvHofJx9zGMbR82vFF3rEEIp1dfDD6KirePgte
// SIG // jlLLryV/rQ7vY/RCHXzNlb2VhL7lcpHqFZSQu9QqKG79
// SIG // TPBEN+3yggx6z4SFg6nrQ7UdQyz7U/rVggORT+Z6x+Iq
// SIG // swjkqme+BRoppUW77TYxOvcz8Z+wXvSCQIbLc4DT+wTo
// SIG // 4eyD9FI6OFi3qyEKz0Bq92R6w4kh2YHgLzCCB3owggVi
// SIG // oAMCAQICCmEOkNIAAAAAAAMwDQYJKoZIhvcNAQELBQAw
// SIG // gYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1p
// SIG // Y3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1dGhvcml0
// SIG // eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcwODIx
// SIG // MDkwOVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh
// SIG // c2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNV
// SIG // BAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UE
// SIG // AxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAx
// SIG // MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIB
// SIG // AKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCquAY4
// SIG // GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJDXlk
// SIG // h36UYCRsr55JnOloXtLfm1OyCizDr9mpK656Ca/XllnK
// SIG // YBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3WraPPLbfM6
// SIG // XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5pUkp
// SIG // 5w2+oBN3vpQ97/vjK1oQH01WKKJ6cuASOrdJXtjt7UOR
// SIG // g9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7La4zWMW3Pv4y
// SIG // 07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwPrRkj
// SIG // hMv0ugOGjfdf8NBSv4yUh7zAIXQlXxgotswnKDglmDlK
// SIG // Ns98sZKuHCOnqWbsYR9q4ShJnV+I4iVd0yFLPlLEtVc/
// SIG // JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9G9RV
// SIG // S+c5oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/CHFfb
// SIG // g43sTUkwp6uO3+xbn6/83bBm4sGXgXvt1u1L50kppxMo
// SIG // pqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9AN0/B
// SIG // 4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE2rCI
// SIG // F96eTvSWsLxGoGyY0uDWiIwLAgMBAAGjggHtMIIB6TAQ
// SIG // BgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k5VAF
// SIG // 04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAweCgBT
// SIG // AHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQF
// SIG // MAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kUBU7h6qfH
// SIG // MdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDovL2Ny
// SIG // bC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
// SIG // TWljUm9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNybDBe
// SIG // BggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0dHA6
// SIG // Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWlj
// SIG // Um9vQ2VyQXV0MjAxMV8yMDExXzAzXzIyLmNydDCBnwYD
// SIG // VR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYIKwYB
// SIG // BQUHAgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvZG9jcy9wcmltYXJ5Y3BzLmh0bTBABggrBgEF
// SIG // BQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABpAGMA
// SIG // eQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG
// SIG // 9w0BAQsFAAOCAgEAZ/KGpZjgVHkaLtPYdGcimwuWEeFj
// SIG // kplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79HqaPz
// SIG // adtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS0LD9
// SIG // a+M+By4pm+Y9G6XUtR13lDni6WTJRD14eiPzE32mkHSD
// SIG // jfTLJgJGKsKKELukqQUMm+1o+mgulaAqPyprWEljHwlp
// SIG // blqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMOr5ko
// SIG // l5hNDj0L8giJ1h/DMhji8MUtzluetEk5CsYKwsatruWy
// SIG // 2dsViFFFWDgycScaf7H0J/jeLDogaZiyWYlobm+nt3TD
// SIG // QAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVAKmWj
// SIG // w11SYobDHWM2l4bf2vP48hahmifhzaWX0O5dY0HjWwec
// SIG // hz4GdwbRBrF1HxS+YWG18NzGGwS+30HHDiju3mUv7Jf2
// SIG // oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3HjXG
// SIG // 0qKin3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs6jeZ
// SIG // eRhL/9azI2h15q/6/IvrC4DqaTuv/DDtBEyO3991bWOR
// SIG // PdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYibV3FW
// SIG // TkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xghqj
// SIG // MIIanwIBATCBlTB+MQswCQYDVQQGEwJVUzETMBEGA1UE
// SIG // CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEe
// SIG // MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgw
// SIG // JgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBTaWduaW5nIFBD
// SIG // QSAyMDExAhMzAAAErHYv/m7SjIRoAAAAAASsMA0GCWCG
// SIG // SAFlAwQCAQUAoIGuMBkGCSqGSIb3DQEJAzEMBgorBgEE
// SIG // AYI3AgEEMBwGCisGAQQBgjcCAQsxDjAMBgorBgEEAYI3
// SIG // AgEVMC8GCSqGSIb3DQEJBDEiBCAqPHR8kNOSbEPOJVRr
// SIG // u6pXhXXxJhuWp3V2+nwuybEkZDBCBgorBgEEAYI3AgEM
// SIG // MTQwMqAUgBIATQBpAGMAcgBvAHMAbwBmAHShGoAYaHR0
// SIG // cDovL3d3dy5taWNyb3NvZnQuY29tMA0GCSqGSIb3DQEB
// SIG // AQUABIIBgGO7YSWiEy/yq4VoqId5A6VsqRI69GThmRK/
// SIG // sUazdFC5MAcGbxoeXWamBaSKVcSqyV16+MWIhRRnuJPM
// SIG // wCz1qkeR28kMwatEGFwXrvX9er82Pzwx++PhyGwuK1Qc
// SIG // nOwDFYzcgXsH4WYfn223gQxeB/BOKGjJswgrjy9qc3ET
// SIG // u6BKEb/xfqYPLPV14pTbRDmH3OMDZXJgAJba293ss168
// SIG // v4x3d+ImX6S8BC7ndcdQcYrQS3pI68DN2rCB0BbJ7Ef2
// SIG // g/WMSlgUEv1No9qH99TiICn4qR0WkdeSz09M7TOXw5bw
// SIG // +joVBGL5J6+doNe4iVsHMq5b/oIpiXV+nJqVpWKmqpjb
// SIG // mXMS9KXObJKda2uXPWtiVJT5cOcWH3fbKe4ylNIjm75y
// SIG // j1ZFKkro6hMwQTuhzWCErWb/8iJZ/CWWXWHC6wbaD3c5
// SIG // fhrlHa8Ool066tGlB4hOtkFXSfxekiQ5/Ki9GTHr7Pvd
// SIG // nAGhFK9nnzeo/eqONfQx0SQy5YIkSGmsiq0OcKGCF60w
// SIG // ghepBgorBgEEAYI3AwMBMYIXmTCCF5UGCSqGSIb3DQEH
// SIG // AqCCF4YwgheCAgEDMQ8wDQYJYIZIAWUDBAIBBQAwggFa
// SIG // BgsqhkiG9w0BCRABBKCCAUkEggFFMIIBQQIBAQYKKwYB
// SIG // BAGEWQoDATAxMA0GCWCGSAFlAwQCAQUABCBB+btfHcmt
// SIG // pO91V5XMSXicLEaijkkTT7JcLAiduIOtwgIGaPISSlP6
// SIG // GBMyMDI1MTAyMTAyMjU1Ny43NjFaMASAAgH0oIHZpIHW
// SIG // MIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRN
// SIG // aWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25zIExpbWl0
// SIG // ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVTTjo0MzFB
// SIG // LTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRp
// SIG // bWUtU3RhbXAgU2VydmljZaCCEfswggcoMIIFEKADAgEC
// SIG // AhMzAAACHUvAkoc4hX45AAEAAAIdMA0GCSqGSIb3DQEB
// SIG // CwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMT
// SIG // HU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMB4X
// SIG // DTI1MDgxNDE4NDgzM1oXDTI2MTExMzE4NDgzM1owgdMx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xLTArBgNVBAsTJE1pY3Jv
// SIG // c29mdCBJcmVsYW5kIE9wZXJhdGlvbnMgTGltaXRlZDEn
// SIG // MCUGA1UECxMeblNoaWVsZCBUU1MgRVNOOjQzMUEtMDVF
// SIG // MC1EOTQ3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBTZXJ2aWNlMIICIjANBgkqhkiG9w0BAQEFAAOC
// SIG // Ag8AMIICCgKCAgEAorSgaAA8oOl4ph574zw29egUN8DD
// SIG // epRHLX8FM1zHNJmXG6KrSqUKwzcKafopuYdPTETTCvb9
// SIG // aJfESuAU0iGNUFI/D6R0kvdfpe2oPX+E3sbTQvGi4JPH
// SIG // 5qdIYUaJ45V/4bqe8eNvbWzpC+ZKjH193DeiI1XAI918
// SIG // JoQmBhlEXo/Ton1721luZJgincsf5LjMY3jX84WyXUSX
// SIG // 3dsS7h/7xVI+w1yjg7pa+0y3o/me2Tsv6UJUdSTQap5O
// SIG // RGSfCnclnP1z3IiiWIWr3Vo7aIPWsgJzq3m5GxpxUHCQ
// SIG // k8qzUhk50y/uB+LGE3WIK2C77iy9iFsSfSLUnyMEzGRD
// SIG // W9mXHT4PH7Ozz6CHqQEiNvwcHqlvlCh1pHQh1NXQSAqO
// SIG // oVBs5mi6easf6yxWTfe5DrR79503r8pU6VqC2Y9XMRU4
// SIG // wH9QbYXYsIUZ33Jmndy22W1LBDAbxBPQHCBlncGDU3Bg
// SIG // dhVUVLe80mggFO98FdkWho67w4kPdCTRkvdvkY8PrQYE
// SIG // /nQjHXCa0g7LcMttZb6ejMHfQ+tUWXv6+nZ4Ynkr2Oka
// SIG // xclFCw4RIYNMWD26AWbQj/WEdzga18fKtw66L5gzXPza
// SIG // 6jFBfPJeKE3H8QAuwpirmH4ms+5nUjNNQOmNgqJn0U1+
// SIG // 3Yn7ClswD79YN0r3fdbYBMDApBZJpNlK7q7HXRsCAwEA
// SIG // AaOCAUkwggFFMB0GA1UdDgQWBBSEWfBxNEamZtXm8gl9
// SIG // 2Yq80jfxXTAfBgNVHSMEGDAWgBSfpxVdAF5iXYP05dJl
// SIG // pxtTNRnpcjBfBgNVHR8EWDBWMFSgUqBQhk5odHRwOi8v
// SIG // d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNy
// SIG // b3NvZnQlMjBUaW1lLVN0YW1wJTIwUENBJTIwMjAxMCgx
// SIG // KS5jcmwwbAYIKwYBBQUHAQEEYDBeMFwGCCsGAQUFBzAC
// SIG // hlBodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L2NlcnRzL01pY3Jvc29mdCUyMFRpbWUtU3RhbXAlMjBQ
// SIG // Q0ElMjAyMDEwKDEpLmNydDAMBgNVHRMBAf8EAjAAMBYG
// SIG // A1UdJQEB/wQMMAoGCCsGAQUFBwMIMA4GA1UdDwEB/wQE
// SIG // AwIHgDANBgkqhkiG9w0BAQsFAAOCAgEAkdweB4yxvLsp
// SIG // LKq0D+miyD4Q0EcxVFpNZuJxiR54gWRkeTDDuymNeB03
// SIG // JhlsBpbwSYJ5uZSgDBCvwHED2VL8lJpFlOprJzxsXWC2
// SIG // NTfA+O+PO5Fk5jw6LHh6jeBADDEdQAx3Hqi7Zm0JwvQ9
// SIG // 3z5f6dtxkm29WqOcHYXRXfAQwy1hSrLXyfeblqR66jpP
// SIG // /9n0fCkWU4ggsUjQpQ2Ngj1DV09J4Y3y7p9Nd81+Xs6q
// SIG // Yo++7RKm8qiB/5NDeigOLjlAeFgiEXIRUJW+mJyqpQw+
// SIG // OORlaqcFjR8Hu0G+/7bMdek68YX+kPpDBk7Ue+I/xgiY
// SIG // J1xcDRBn/vczLtN72+RIlD4UgXYLuBSCk//pDEPX5z39
// SIG // Cr+rkc6E4Y28FPk4BhloAyvp628P4xfElQY8TcxraUbZ
// SIG // ShypocE6ny95D1K1BkltZmrHVKCxmglnuOlM15NKIrXF
// SIG // lXCzdqpCtIwQ417wNAVF/QDPvzzbumPdTi6fb0tLbScY
// SIG // obV6zvbBsMsKEME4Tj1b9oIXC8dybJq4nbboEXYpRwi1
// SIG // QAbpSNrn+PxGW9uf1q63FnMJu4gm3Oh63njW/iVf723q
// SIG // uzyHrSijWMgY0HiRiHQi0Jyu0h8MdhRUp7mxbmLQckPi
// SIG // OFwAlIaUN/k725y/aLWpkRU6fqmLlEOyH5WpyLd23AYy
// SIG // 9r8v+Qoba6swggdxMIIFWaADAgECAhMzAAAAFcXna54C
// SIG // m0mZAAAAAAAVMA0GCSqGSIb3DQEBCwUAMIGIMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQg
// SIG // Um9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAxMDAe
// SIG // Fw0yMTA5MzAxODIyMjVaFw0zMDA5MzAxODMyMjVaMHwx
// SIG // CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9u
// SIG // MRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
// SIG // b3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jv
// SIG // c29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwMIICIjANBgkq
// SIG // hkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA5OGmTOe0ciEL
// SIG // eaLL1yR5vQ7VgtP97pwHB9KpbE51yMo1V/YBf2xK4OK9
// SIG // uT4XYDP/XE/HZveVU3Fa4n5KWv64NmeFRiMMtY0Tz3cy
// SIG // wBAY6GB9alKDRLemjkZrBxTzxXb1hlDcwUTIcVxRMTeg
// SIG // Cjhuje3XD9gmU3w5YQJ6xKr9cmmvHaus9ja+NSZk2pg7
// SIG // uhp7M62AW36MEBydUv626GIl3GoPz130/o5Tz9bshVZN
// SIG // 7928jaTjkY+yOSxRnOlwaQ3KNi1wjjHINSi947SHJMPg
// SIG // yY9+tVSP3PoFVZhtaDuaRr3tpK56KTesy+uDRedGbsoy
// SIG // 1cCGMFxPLOJiss254o2I5JasAUq7vnGpF1tnYN74kpEe
// SIG // HT39IM9zfUGaRnXNxF803RKJ1v2lIH1+/NmeRd+2ci/b
// SIG // fV+AutuqfjbsNkz2K26oElHovwUDo9Fzpk03dJQcNIIP
// SIG // 8BDyt0cY7afomXw/TNuvXsLz1dhzPUNOwTM5TI4CvEJo
// SIG // LhDqhFFG4tG9ahhaYQFzymeiXtcodgLiMxhy16cg8ML6
// SIG // EgrXY28MyTZki1ugpoMhXV8wdJGUlNi5UPkLiWHzNgY1
// SIG // GIRH29wb0f2y1BzFa/ZcUlFdEtsluq9QBXpsxREdcu+N
// SIG // +VLEhReTwDwV2xo3xwgVGD94q0W29R6HXtqPnhZyacau
// SIG // e7e3PmriLq0CAwEAAaOCAd0wggHZMBIGCSsGAQQBgjcV
// SIG // AQQFAgMBAAEwIwYJKwYBBAGCNxUCBBYEFCqnUv5kxJq+
// SIG // gpE8RjUpzxD/LwTuMB0GA1UdDgQWBBSfpxVdAF5iXYP0
// SIG // 5dJlpxtTNRnpcjBcBgNVHSAEVTBTMFEGDCsGAQQBgjdM
// SIG // g30BATBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1p
// SIG // Y3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVwb3NpdG9y
// SIG // eS5odG0wEwYDVR0lBAwwCgYIKwYBBQUHAwgwGQYJKwYB
// SIG // BAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGG
// SIG // MA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU1fZW
// SIG // y4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBLoEmg
// SIG // R4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9j
// SIG // cmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0XzIwMTAtMDYt
// SIG // MjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggrBgEFBQcw
// SIG // AoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9j
// SIG // ZXJ0cy9NaWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcnQw
// SIG // DQYJKoZIhvcNAQELBQADggIBAJ1VffwqreEsH2cBMSRb
// SIG // 4Z5yS/ypb+pcFLY+TkdkeLEGk5c9MTO1OdfCcTY/2mRs
// SIG // fNB1OW27DzHkwo/7bNGhlBgi7ulmZzpTTd2YurYeeNg2
// SIG // LpypglYAA7AFvonoaeC6Ce5732pvvinLbtg/SHUB2Rje
// SIG // bYIM9W0jVOR4U3UkV7ndn/OOPcbzaN9l9qRWqveVtihV
// SIG // J9AkvUCgvxm2EhIRXT0n4ECWOKz3+SmJw7wXsFSFQrP8
// SIG // DJ6LGYnn8AtqgcKBGUIZUnWKNsIdw2FzLixre24/LAl4
// SIG // FOmRsqlb30mjdAy87JGA0j3mSj5mO0+7hvoyGtmW9I/2
// SIG // kQH2zsZ0/fZMcm8Qq3UwxTSwethQ/gpY3UA8x1RtnWN0
// SIG // SCyxTkctwRQEcb9k+SS+c23Kjgm9swFXSVRk2XPXfx5b
// SIG // RAGOWhmRaw2fpCjcZxkoJLo4S5pu+yFUa2pFEUep8beu
// SIG // yOiJXk+d0tBMdrVXVAmxaQFEfnyhYWxz/gq77EFmPWn9
// SIG // y8FBSX5+k77L+DvktxW/tM4+pTFRhLy/AsGConsXHRWJ
// SIG // jXD+57XQKBqJC4822rpM+Zv/Cuk0+CQ1ZyvgDbjmjJnW
// SIG // 4SLq8CdCPSWU5nR0W2rRnj7tfqAxM328y+l7vzhwRNGQ
// SIG // 8cirOoo6CGJ/2XBjU02N7oJtpQUQwXEGahC0HVUzWLOh
// SIG // cGbyoYIDVjCCAj4CAQEwggEBoYHZpIHWMIHTMQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQg
// SIG // SXJlbGFuZCBPcGVyYXRpb25zIExpbWl0ZWQxJzAlBgNV
// SIG // BAsTHm5TaGllbGQgVFNTIEVTTjo0MzFBLTA1RTAtRDk0
// SIG // NzElMCMGA1UEAxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAg
// SIG // U2VydmljZaIjCgEBMAcGBSsOAwIaAxUAuoO+BKbfXzqy
// SIG // fi9GLEdWHkCLeT+ggYMwgYCkfjB8MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSYwJAYDVQQDEx1NaWNyb3NvZnQgVGltZS1T
// SIG // dGFtcCBQQ0EgMjAxMDANBgkqhkiG9w0BAQsFAAIFAOyh
// SIG // LbwwIhgPMjAyNTEwMjAyMTUzMDBaGA8yMDI1MTAyMTIx
// SIG // NTMwMFowdDA6BgorBgEEAYRZCgQBMSwwKjAKAgUA7KEt
// SIG // vAIBADAHAgEAAgI2XjAHAgEAAgIS5jAKAgUA7KJ/PAIB
// SIG // ADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMC
// SIG // oAowCAIBAAIDB6EgoQowCAIBAAIDAYagMA0GCSqGSIb3
// SIG // DQEBCwUAA4IBAQBYDUJc1iUTSUlMs7zmozqFNSMjEvYz
// SIG // 3JUzmk+vQHn/Z9V8gRkn2xM7Q4GkPM5Z6OalLypvJp65
// SIG // jA6aZw+YokyU3Q0aa7pwP5adlrDegnrBbG9zMksrx+wf
// SIG // IH3AJr1vPtN1sNB6p/fM/Umt/CVancO2o6WYWs3CV/Cx
// SIG // zDnp7aWcPLAOpWiUuxc1NLgN/W+T6Xx3b1PS4PU7v+vp
// SIG // 3jtAYHAhljRVMZm9T6l6b7FCRDwfilgJQQLNW1QW4Zk2
// SIG // gueHfHZ+jaLLCtSRVZuMB5ioQtektqUB01GA6848OSkd
// SIG // nlmnoExJsxrjVhndxSyKqPIqUw804BUlkn7wLM9+5bzP
// SIG // di09MYIEDTCCBAkCAQEwgZMwfDELMAkGA1UEBhMCVVMx
// SIG // EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
// SIG // ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
// SIG // dGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUtU3Rh
// SIG // bXAgUENBIDIwMTACEzMAAAIdS8CShziFfjkAAQAAAh0w
// SIG // DQYJYIZIAWUDBAIBBQCgggFKMBoGCSqGSIb3DQEJAzEN
// SIG // BgsqhkiG9w0BCRABBDAvBgkqhkiG9w0BCQQxIgQgmFH5
// SIG // s38mEfpx/HaXSL94DxPyQqzASfCRhPBvdHg42lMwgfoG
// SIG // CyqGSIb3DQEJEAIvMYHqMIHnMIHkMIG9BCCxtpXMXEiL
// SIG // JzrqM77ep4rTNwrMOj6gpWN9hZvpj5QFUTCBmDCBgKR+
// SIG // MHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5n
// SIG // dG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVN
// SIG // aWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1p
// SIG // Y3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAC
// SIG // HUvAkoc4hX45AAEAAAIdMCIEIMgHCO3TNCyzrS3DJxmZ
// SIG // KXvWMYNa+557Q3eUKCc+Ym9vMA0GCSqGSIb3DQEBCwUA
// SIG // BIICAF12HeoITd7eW0tyJztXZQKk3vToVZpUAKwRPQMr
// SIG // HuEC8EuGD/xZ2Oz9v3hH7KiVxO1grymoauHK6VFlegVv
// SIG // 63DDdvuy2yWXhW9DVL8BrgKJrVBKwC76p+UgH5m18Xju
// SIG // zuuuku+pJogbxBRKnYWNzjMktBGjrImHE3WVdgCyQfHU
// SIG // j/XG52hRPEiCvJd76Fl6hBkYlYWCARiVtZ3CJK6aWwqv
// SIG // 6AMastpHEEY7ZZfu2+TRMJUHI7gnBmhu+GILp/ZYk3sP
// SIG // EmxsegGFjUbP4p+E4B16mU1sD8H628nOtYUZ+rKsZj7F
// SIG // +S6pRCNshFomOXpSQmsMOU+7+UsYwf/V0LZyIY9IY8AI
// SIG // Bs7XdBJHg1tgQT94P3OtmO1hvjSkd5KuX5EunDvE9XKv
// SIG // 0cniktROchKuTrbN30aXFFb4NTZJARdWkmBCd/JcL9nG
// SIG // +y3EU5c8tonp067brBvwwkmx0YT7SfL8CVaVYyZ11/UL
// SIG // 0AStUeglnWvwxXysx7pmHDTRUL0IzAXV9KgFDP2l+N3+
// SIG // 9BGo1Is2DWwmEfj40cMp7qSZyqDUapBqP9aL1DaG++xS
// SIG // gwTmgywtxhhmJH9QR2hV2wN6zOCm/E5RUAtX1ETk/ULC
// SIG // pwFcUGSX/yi0VnHB8hw3knCET/nXD4a66eUjVnMcboIv
// SIG // iFCsF4UUwynTQiJJg3dURmjqxE9q
// SIG // End signature block
