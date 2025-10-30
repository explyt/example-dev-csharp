import './plotly-basic-2.35.2.min.js'

export function initializeChart(id, traces, exemplarTrace, rangeStartTime, rangeEndTime, serverLocale, chartInterop) {
    registerLocale(serverLocale);

    var chartContainerDiv = document.getElementById(id);
    if (!chartContainerDiv) {
        console.log(`Couldn't find container '${id}' when initializing chart.`);
        return;
    }

    // Reusing a div can create issues with chart lines appearing beyond the end range.
    // Workaround this issue by replacing the chart div. Ensures we start from a new state.
    var chartDiv = document.createElement("div");
    chartContainerDiv.replaceChildren(chartDiv);

    var themeColors = getThemeColors();

    var data = [];
    for (var i = 0; i < traces.length; i++) {
        var name = traces[i].name || "Value";
        var t = {
            x: traces[i].x,
            y: traces[i].y,
            name: name,
            text: traces[i].tooltips,
            hoverinfo: 'text',
            stackgroup: "one"
        };
        data.push(t);
    }

    var points = {
        x: exemplarTrace.x,
        y: exemplarTrace.y,
        name: exemplarTrace.name,
        text: exemplarTrace.tooltips,
        hoverinfo: 'text',
        traceData: exemplarTrace.traceData,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 16,
            color: themeColors.pointColor,
            line: {
                color: themeColors.backgroundColor,
                width: 1
            }
        }
    };
    data.push(points);

    // Width and height are set using ResizeObserver + ploty resize call.
    var layout = {
        paper_bgcolor: themeColors.backgroundColor,
        plot_bgcolor: themeColors.backgroundColor,
        margin: { t: 0, r: 0, b: 40, l: 50 },
        xaxis: {
            type: 'date',
            range: [rangeEndTime, rangeStartTime],
            fixedrange: true,
            tickformat: "%X",
            color: themeColors.textColor
        },
        yaxis: {
            rangemode: "tozero",
            fixedrange: true,
            color: themeColors.textColor
        },
        hovermode: "closest",
        showlegend: true,
        legend: {
            orientation: "h",
            font: {
                color: themeColors.textColor
            },
            traceorder: "normal",
            itemclick: false,
            itemdoubleclick: false
        }
    };

    var options = { scrollZoom: false, displayModeBar: false };

    var plot = Plotly.newPlot(chartDiv, data, layout, options);

    fixTraceLineRendering(chartDiv);

    // We only want a pointer cursor when the mouse is hovering over an exemplar point.
    // Set the drag layer cursor back to the default and then use plotly_hover/ploty_unhover events to set to pointer.
    var dragLayer = document.getElementsByClassName('nsewdrag')[0];
    dragLayer.style.cursor = 'default';

    // Use mousedown instead of plotly_click event because plotly_click has issues with updating charts.
    // The current point is tracked by setting it with hover/unhover events and then mousedown uses the current value.
    var currentPoint = null;
    chartDiv.on('plotly_hover', function (data) {
        var point = data.points[0];
        if (point.fullData.name == exemplarTrace.name) {
            currentPoint = point;
            dragLayer.style.cursor = 'pointer';
        }
    });
    chartDiv.on('plotly_unhover', function (data) {
        var point = data.points[0];
        if (point.fullData.name == exemplarTrace.name) {
            currentPoint = null;
            dragLayer.style.cursor = 'default';
        }
    });
    chartDiv.addEventListener("mousedown", (e) => {
        if (currentPoint) {
            var point = currentPoint;
            var pointTraceData = point.data.traceData[point.pointIndex];

            var traceId = pointTraceData.traceId;
            var spanId = pointTraceData.spanId;

            // If the exemplar has trace and span details then navigate to the span on click.
            if (traceId && spanId) {
                chartInterop.invokeMethodAsync('ViewSpan', traceId, spanId);
            }
        }
    });

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            // Don't resize if not visible.
            var display = window.getComputedStyle(entry.target).display;
            var isHidden = !display || display === "none";
            if (!isHidden) {
                Plotly.Plots.resize(entry.target);
            }
        }
    });
    plot.then(plotyDiv => {
        resizeObserver.observe(plotyDiv);
    });
}

export function updateChart(id, traces, exemplarTrace, rangeStartTime, rangeEndTime) {
    var chartContainerDiv = document.getElementById(id);
    if (!chartContainerDiv) {
        console.log(`Couldn't find container '${id}' when updating chart.`);
        return;
    }

    var chartDiv = chartContainerDiv.firstChild;
    if (!chartDiv) {
        console.log(`Couldn't find div inside container '${id}' when updating chart. Chart may not have been successfully initialized.`);
        return;
    }

    var themeColors = getThemeColors();

    var xUpdate = [];
    var yUpdate = [];
    var tooltipsUpdate = [];
    var traceData = [];
    for (var i = 0; i < traces.length; i++) {
        xUpdate.push(traces[i].x);
        yUpdate.push(traces[i].y);
        tooltipsUpdate.push(traces[i].tooltips);
        traceData.push(traces.traceData);
    }

    xUpdate.push(exemplarTrace.x);
    yUpdate.push(exemplarTrace.y);
    tooltipsUpdate.push(exemplarTrace.tooltips);
    traceData.push(exemplarTrace.traceData);

    var data = {
        x: xUpdate,
        y: yUpdate,
        text: tooltipsUpdate,
        traceData: traceData
    };

    var layout = {
        xaxis: {
            type: 'date',
            range: [rangeEndTime, rangeStartTime],
            fixedrange: true,
            tickformat: "%X",
            color: themeColors.textColor
        }
    };

    Plotly.update(chartDiv, data, layout);

    fixTraceLineRendering(chartDiv);
}

function getThemeColors() {
    // Get colors from the current light/dark theme.
    var style = getComputedStyle(document.body);
    return {
        backgroundColor: style.getPropertyValue("--fill-color"),
        textColor: style.getPropertyValue("--neutral-foreground-rest"),
        pointColor: style.getPropertyValue("--accent-fill-rest")
    };
}

function fixTraceLineRendering(chartDiv) {
    // In stack area charts Plotly orders traces so the top line area overwrites the line of areas below it.
    // This isn't the effect we want. When the P50, P90 and P99 values are the same, the line displayed is P99
    // on the P50 area.
    //
    // The fix is to reverse the order of traces so the correct line is on top. There isn't a way to do this
    // with CSS because SVG doesn't support z-index. Node order is what determines the rendering order.
    //
    // https://github.com/plotly/plotly.js/issues/6579
    var parent = chartDiv.querySelector(".scatterlayer");

    if (parent.childNodes.length > 0) {
        for (var i = 1; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            parent.insertBefore(child, parent.firstChild);
        }

        // Check if there is a trace with points. It should be top most.
        for (var i = 0; i < parent.childNodes.length; i++) {
            var child = parent.childNodes[i];
            if (child.querySelector(".point")) {
                // Append trace to parent to move to the last in the collection.
                parent.appendChild(child);
            }
        }
    }
}

function registerLocale(serverLocale) {
    // Register the locale for Plotly.js. This is to enable localization of time format shown by the charts.
    // Changing plotly.js time formatting is better than supplying values from the server which is very difficult to do correctly.

    // Right now necessary changes are to:
    // -Update AM/PM
    // -Update time format to 12/24 hour.
    var locale = {
        moduleType: 'locale',
        name: 'en',
        dictionary: {
            'Click to enter Colorscale title': 'Click to enter Colourscale title'
        },
        format: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            periods: serverLocale.periods,
            dateTime: '%a %b %e %X %Y',
            date: '%d/%m/%Y',
            time: serverLocale.time,
            decimal: '.',
            thousands: ',',
            grouping: [3],
            currency: ['$', ''],
            year: '%Y',
            month: '%b %Y',
            dayMonth: '%b %-d',
            dayMonthYear: '%b %-d, %Y'
        }
    };
    Plotly.register(locale);
}

// SIG // Begin signature block
// SIG // MIIpPwYJKoZIhvcNAQcCoIIpMDCCKSwCAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // JsqrKYYDppcRe/wmSsdp1oR4Lx1h+DqHrByc88EhfDig
// SIG // gg30MIIGcjCCBFqgAwIBAgITMwAABKuvOsiCTkhVXQAA
// SIG // AAAEqzANBgkqhkiG9w0BAQwFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTI1MDkxODE3NTg1N1oX
// SIG // DTI2MDcwNjE3NTg1N1owYzELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjENMAsGA1UEAxMELk5FVDCCAaIwDQYJKoZIhvcNAQEB
// SIG // BQADggGPADCCAYoCggGBAKQ4X+4WJICq9ogp+93S3ign
// SIG // Qhx+0SjWT/ZIdwwhDFj10Yfczf2kmMk593Z6IR+5G1Fb
// SIG // PQKk9YHI8vxLyK9K89H7AmPzyxu1tZnS5gqoD70m3sZA
// SIG // OI43mWo1H3KebvYI/abH6XZWAOekiOSx7yMEvA1LX3ge
// SIG // mWEaV0Otsd43VuWRRgmTjyFhiKHThv218roy1mTBbUXw
// SIG // 2gq6o3BcVsr8IalHQSS1U7v534eysUqzI11WlC0+ncUF
// SIG // 9r2ej0mdX61gLWSNZCKNdZ/mXXPMEhz2Q07iwdpAy6O6
// SIG // HNrASQnwfTRVnCn+TY/+E3BoBpUCV7Dg2UMTYJQlAsw7
// SIG // mEaaWSSW3a+S8aFC9unWFY0dNeRox6xl3vjTbzOMpXyr
// SIG // H+/0MDHGqaEO4vSbkIFLyVv6yxqOCtp/k0OcVcu20mBd
// SIG // cKQLKkK37CfjPg82u/8DT0cenCptF0BKVfahZ7lVah5Q
// SIG // lhOmDilG1KEelL+S/TXuj/tEp/MhgGWyvXi9VpwcmcET
// SIG // FSwUlwIDAQABo4IBgjCCAX4wHwYDVR0lBBgwFgYKKwYB
// SIG // BAGCN0wIAQYIKwYBBQUHAwMwHQYDVR0OBBYEFLT595W9
// SIG // tJwzkjCnj1BmAzR7cFJvMFQGA1UdEQRNMEukSTBHMS0w
// SIG // KwYDVQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRp
// SIG // b25zIExpbWl0ZWQxFjAUBgNVBAUTDTQ2NDIyMys1MDYw
// SIG // OTAwHwYDVR0jBBgwFoAUSG5k5VAF04KqFzc3IrVtqMp1
// SIG // ApUwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL3d3dy5t
// SIG // aWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWljQ29kU2ln
// SIG // UENBMjAxMV8yMDExLTA3LTA4LmNybDBhBggrBgEFBQcB
// SIG // AQRVMFMwUQYIKwYBBQUHMAKGRWh0dHA6Ly93d3cubWlj
// SIG // cm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljQ29kU2ln
// SIG // UENBMjAxMV8yMDExLTA3LTA4LmNydDAMBgNVHRMBAf8E
// SIG // AjAAMA0GCSqGSIb3DQEBDAUAA4ICAQAHYavo22iKWwSP
// SIG // Fqby97naAenHdlPya5n7g4LWyZURPwKJebBcYN5Ye/Om
// SIG // bkqpGYU9mwFZw6mdkhtP9voNSGhoAq1gsSasS9ni3832
// SIG // F5MP//pfk/vKkluVSti72uM3fqJnD/L/+Fnxg4blQIP4
// SIG // n83zfdSaUm3N1+4SMVsiMXcwbVnJ5xTWSn4bjCEljcfd
// SIG // 66JWujAWUVmjv4CG0SDO7ycJVuYfsY0iQbrkTRPepX1S
// SIG // TCuC3Hl+AYjWeUydM3YdH6G00PJPNOnPjKQdeSqbMXpp
// SIG // U3J3YQ1quEpoEaw6iQ/WDTrJTh4dwqS0mNWgu+nwSgFH
// SIG // EgHhQziOtPsqtatiDcfSAX8ScmimhOBPEUT/8OMP4llp
// SIG // gvUXQBa7cv3Uli4DS5vRbn3hyIFFQ2DyGSD5eRQI8T7q
// SIG // jC9DAX84zq2Q/dgw8Z6x2m9528a/1IeG4B2YEHIdOjMP
// SIG // cvF3fcZ8ocPo9Ek4VojynTBPN2NNBB66/dzysj5Ozg/P
// SIG // upGwvl2zhYDEqQtz1z7qQGyrMor7ce4yeiZoX7atCMX8
// SIG // GH94BhuFKx8q4mogSMzW1UINWMoRX/5rqKxZy4LUHnf/
// SIG // TAfcKhp+RUljdmkhqvtEb/DkyW/p/UunbuIjKXDjaDGP
// SIG // yqs51MNZ0H70DWM8yWf18sUjgsZaWC4hmTEmQcOU6le8
// SIG // CJVNG7jRZDCCB3owggVioAMCAQICCmEOkNIAAAAAAAMw
// SIG // DQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRp
// SIG // ZmljYXRlIEF1dGhvcml0eSAyMDExMB4XDTExMDcwODIw
// SIG // NTkwOVoXDTI2MDcwODIxMDkwOVowfjELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEoMCYGA1UEAxMfTWljcm9zb2Z0IENvZGUg
// SIG // U2lnbmluZyBQQ0EgMjAxMTCCAiIwDQYJKoZIhvcNAQEB
// SIG // BQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6qghBNNLry
// SIG // tlghn0IbKmvpWlCquAY4GgRJun/DDB7dN2vGEtgL8DjC
// SIG // mQawyDnVARQxQtOJDXlkh36UYCRsr55JnOloXtLfm1Oy
// SIG // CizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv56sIUM+z
// SIG // RLdd2MQuA3WraPPLbfM6XKEW9Ea64DhkrG5kNXimoGMP
// SIG // LdNAk/jj3gcN1Vx5pUkp5w2+oBN3vpQ97/vjK1oQH01W
// SIG // KKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd6IlPhBry
// SIG // oS9Z5JA7La4zWMW3Pv4y07MDPbGyr5I4ftKdgCz1TlaR
// SIG // ITUlwzluZH9TupwPrRkjhMv0ugOGjfdf8NBSv4yUh7zA
// SIG // IXQlXxgotswnKDglmDlKNs98sZKuHCOnqWbsYR9q4ShJ
// SIG // nV+I4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43BdD1FGd7P4
// SIG // AOG8rAKCX9vAFbO9G9RVS+c5oQ/pI0m8GLhEfEXkwcNy
// SIG // euBy5yTfv0aZxe/CHFfbg43sTUkwp6uO3+xbn6/83bBm
// SIG // 4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7IvhNdXnFy/
// SIG // dygo8e1twyiPLI9AN0/B4YVEicQJTMXUpUMvdJX3bvh4
// SIG // IFgsE11glZo+TzOE2rCIF96eTvSWsLxGoGyY0uDWiIwL
// SIG // AgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEEAwIBADAd
// SIG // BgNVHQ4EFgQUSG5k5VAF04KqFzc3IrVtqMp1ApUwGQYJ
// SIG // KwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQD
// SIG // AgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAU
// SIG // ci06AjGQQ7kUBU7h6qfHMdEjiTQwWgYDVR0fBFMwUTBP
// SIG // oE2gS4ZJaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3Br
// SIG // aS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0MjAxMV8y
// SIG // MDExXzAzXzIyLmNybDBeBggrBgEFBQcBAQRSMFAwTgYI
// SIG // KwYBBQUHMAKGQmh0dHA6Ly93d3cubWljcm9zb2Z0LmNv
// SIG // bS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0MjAxMV8yMDEx
// SIG // XzAzXzIyLmNydDCBnwYDVR0gBIGXMIGUMIGRBgkrBgEE
// SIG // AYI3LgMwgYMwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cu
// SIG // bWljcm9zb2Z0LmNvbS9wa2lvcHMvZG9jcy9wcmltYXJ5
// SIG // Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBMAGUAZwBh
// SIG // AGwAXwBwAG8AbABpAGMAeQBfAHMAdABhAHQAZQBtAGUA
// SIG // bgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEAZ/KGpZjg
// SIG // VHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVfLiw++MNy
// SIG // 0W2D/r4/6ArKO79HqaPzadtjvyI1pZddZYSQfYtGUFXY
// SIG // DJJ80hpLHPM8QotS0LD9a+M+By4pm+Y9G6XUtR13lDni
// SIG // 6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELukqQUMm+1o
// SIG // +mgulaAqPyprWEljHwlpblqYluSD9MCP80Yr3vw70L01
// SIG // 724lruWvJ+3Q3fMOr5kol5hNDj0L8giJ1h/DMhji8MUt
// SIG // zluetEk5CsYKwsatruWy2dsViFFFWDgycScaf7H0J/je
// SIG // LDogaZiyWYlobm+nt3TDQAUGpgEqKD6CPxNNZgvAs031
// SIG // 4Y9/HG8VfUWnduVAKmWjw11SYobDHWM2l4bf2vP48hah
// SIG // mifhzaWX0O5dY0HjWwechz4GdwbRBrF1HxS+YWG18NzG
// SIG // GwS+30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOXpQlLSBCZ
// SIG // gB/QACnFsZulP0V3HjXG0qKin3p6IvpIlR+r+0cjgPWe
// SIG // +L9rt0uX4ut1eBrs6jeZeRhL/9azI2h15q/6/IvrC4Dq
// SIG // aTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4ETIheu9B
// SIG // CrE/+6jMpF3BoYibV3FWTkhFwELJm3ZbCoBIa/15n8G9
// SIG // bW1qyVJzEw16UM0xghqjMIIanwIBATCBlTB+MQswCQYD
// SIG // VQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
// SIG // A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0
// SIG // IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQg
// SIG // Q29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAEq686yIJO
// SIG // SFVdAAAAAASrMA0GCWCGSAFlAwQCAQUAoIGuMBkGCSqG
// SIG // SIb3DQEJAzEMBgorBgEEAYI3AgEEMBwGCisGAQQBgjcC
// SIG // AQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3DQEJBDEi
// SIG // BCDNlJO7djGyWfhsAlhVTKMkZH5lb3bv1DRl68KXCzi4
// SIG // SzBCBgorBgEEAYI3AgEMMTQwMqAUgBIATQBpAGMAcgBv
// SIG // AHMAbwBmAHShGoAYaHR0cDovL3d3dy5taWNyb3NvZnQu
// SIG // Y29tMA0GCSqGSIb3DQEBAQUABIIBgFWg8MXIFeyv8XRU
// SIG // DaNghE4QmBEKAPnasV08KQteS2ILhKd02Y/vcpTlVW9K
// SIG // TGpx6sO6bukSwpjuzjRJQ5l3VeYNkX1QVPaVPruFjEND
// SIG // pbUWKf+MAk/CLLFTTTXL+fu1w0SKb3ww+AnLfmvzLVc2
// SIG // 771xsFsXUbtQTqcbhcEl/Tm/I30ePyZ2BKT9IAgFZ6y0
// SIG // fWqds7XcKCn5u4Fs/hkG21VQpUsIS120XbyHCEO4y0oY
// SIG // 40AzNlsvlH0BGBSIheDnfrFYSgdn8IcUF32UVHtxm0AY
// SIG // PM/m82VgP/WjTjDnF6KVQYenc8J00y+nnsET8LjAidkx
// SIG // kX4iMPvBL8TIonmgsP4Knqx11vuALJAdj7hA3ndQ7/ge
// SIG // oE36BDGIQYA+oaXWPOPEaiHP1O2FLqWuADUdKvZvv/td
// SIG // vK+9WHAL8FtiML0IW6Tnbu8B4+EOLTiuia0bq7dBoXXc
// SIG // SKsH9bswWriS1W4yGqTJ2QI9X9gSZrINyU7BsAC2ir5o
// SIG // TAsSmASmIRNlB6GCF60wghepBgorBgEEAYI3AwMBMYIX
// SIG // mTCCF5UGCSqGSIb3DQEHAqCCF4YwgheCAgEDMQ8wDQYJ
// SIG // YIZIAWUDBAIBBQAwggFaBgsqhkiG9w0BCRABBKCCAUkE
// SIG // ggFFMIIBQQIBAQYKKwYBBAGEWQoDATAxMA0GCWCGSAFl
// SIG // AwQCAQUABCC2r9YCX1RDzjUNoycDKWsOZsDZHkf4XxeQ
// SIG // h+ICysqVvQIGaPIy2OirGBMyMDI1MTAyMTAyMjU1Ni44
// SIG // MzhaMASAAgH0oIHZpIHWMIHTMQswCQYDVQQGEwJVUzET
// SIG // MBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVk
// SIG // bW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0
// SIG // aW9uMS0wKwYDVQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBP
// SIG // cGVyYXRpb25zIExpbWl0ZWQxJzAlBgNVBAsTHm5TaGll
// SIG // bGQgVFNTIEVTTjo1OTFBLTA1RTAtRDk0NzElMCMGA1UE
// SIG // AxMcTWljcm9zb2Z0IFRpbWUtU3RhbXAgU2VydmljZaCC
// SIG // EfswggcoMIIFEKADAgECAhMzAAACFI3NI0TuBt9yAAEA
// SIG // AAIUMA0GCSqGSIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVT
// SIG // MRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdS
// SIG // ZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9y
// SIG // YXRpb24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0
// SIG // YW1wIFBDQSAyMDEwMB4XDTI1MDgxNDE4NDgxOFoXDTI2
// SIG // MTExMzE4NDgxOFowgdMxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // LTArBgNVBAsTJE1pY3Jvc29mdCBJcmVsYW5kIE9wZXJh
// SIG // dGlvbnMgTGltaXRlZDEnMCUGA1UECxMeblNoaWVsZCBU
// SIG // U1MgRVNOOjU5MUEtMDVFMC1EOTQ3MSUwIwYDVQQDExxN
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2aWNlMIICIjAN
// SIG // BgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAyU+nWgCU
// SIG // yvfyGP1zTFkLkdgOutXcVteP/0CeXfrF/66chKl4/MZD
// SIG // CQ6E8Ur4kqgCxQvef7Lg1gfso1EWWKG6vix1VxtvO1kP
// SIG // GK4PZKmOeoeL68F6+Mw2ERPy4BL2vJKf6Lo5Z7X0xkRj
// SIG // tcvfM9T0HDgfHUW6z1CbgQiqrExs2NH27rWpUkyTYrMG
// SIG // 6TXy39+GdMOTgXyUDiRGVHAy3EqYNw3zSWusn0zedl6a
// SIG // /1DbnXIcvn9FaHzd/96EPNBOCd2vOpS0Ck7kgkjVxwOp
// SIG // tsWa8I+m+DA43cwlErPaId84GbdGzo3VoO7YhCmQIoRa
// SIG // b0d8or5Pmyg+VMl8jeoN9SeUxVZpBI/cQ4TXXKlLDkfb
// SIG // zzSQriViQGJGJLtKS3DTVNuBqpjXLdu2p2Yq9ODPqZCo
// SIG // iNBh4CB6X2iLYUSO8tmbUVLMMEegbvHSLXQR88QNICjF
// SIG // oBBDCDydoTo9/TNkq80mO77wDM04tPdvbMmxT01GTod6
// SIG // 0JJxUGmMTgseghdBGjkN+D6GsUpY7ta7hP9PzLrs+Alx
// SIG // u46XT217bBn6EwJsAYAc9C28mKRUcoIZWQRb+McoZaSu
// SIG // 2EcSzuIlAaNIQNtGlz2PF3foSeGmc/V7gCGs8AHkiKwX
// SIG // zJSPftnsH8O/R3pJw2D/2hHE3JzxH2SrLX1FdI7Drw14
// SIG // 5PkL0hbFL6MVCCkCAwEAAaOCAUkwggFFMB0GA1UdDgQW
// SIG // BBTbX/bs1cSpyTYnYuf/Mt9CPNhwGzAfBgNVHSMEGDAW
// SIG // gBSfpxVdAF5iXYP05dJlpxtTNRnpcjBfBgNVHR8EWDBW
// SIG // MFSgUqBQhk5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpb3BzL2NybC9NaWNyb3NvZnQlMjBUaW1lLVN0YW1w
// SIG // JTIwUENBJTIwMjAxMCgxKS5jcmwwbAYIKwYBBQUHAQEE
// SIG // YDBeMFwGCCsGAQUFBzAChlBodHRwOi8vd3d3Lm1pY3Jv
// SIG // c29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUy
// SIG // MFRpbWUtU3RhbXAlMjBQQ0ElMjAyMDEwKDEpLmNydDAM
// SIG // BgNVHRMBAf8EAjAAMBYGA1UdJQEB/wQMMAoGCCsGAQUF
// SIG // BwMIMA4GA1UdDwEB/wQEAwIHgDANBgkqhkiG9w0BAQsF
// SIG // AAOCAgEAP3xp9D4Gu0SH9B+1JH0hswFquINaTT+RjpfE
// SIG // r8UmUOeDl4U5uV+i28/eSYXMxgem3yBZywYDyvf4qMXU
// SIG // vbDcllNqRyL2Rv8jSu8wclt/VS1+c5cVCJfM+WHvkUr+
// SIG // dCfUlOy9n4exCPX1L6uWwFH5eoFfqPEp3Fw30irMN2So
// SIG // nHBK3mB8vDj3D80oJKqe2tatO38yMTiREdC2HD7eVIUW
// SIG // L7d54UtoYxzwkJN1t7gEEGosgBpdmwKVYYDO1USWSNmZ
// SIG // ELglYA4LoVoGDuWbN7mD8VozYBsfkZarOyrJYlF/UCDZ
// SIG // LB8XaLfrMfMyZTMCOuEuPD4zj8jy/Jt40clrIW04cvLh
// SIG // khkydBzcrmC2HxeE36gJsh+jzmivS9YvyiPhLkom1FP0
// SIG // DIFr4VlqyXHKagrtnqSF8QyEpqtQS7wS7ZzZF0eZe0fs
// SIG // YD0J1RarbVuDxmWsq45n1vjRdontuGUdmrG2OGeKd8At
// SIG // iNghfnabVBbgpYgcx/eLyW/n40eTbKIlsm0cseyuWvYF
// SIG // yOqQXjoWtL4/sUHxlWIsrjnNarNr+POkL8C1jGBCJuvm
// SIG // 0UYgjhIaL+XBXavrbOtX9mrZ3y8GQDxWXn3mhqM21ZcG
// SIG // k83xSRqB9ecfGYNRG6g65v635gSzUmBKZWWcDNzwAoxs
// SIG // gEjTFXz6ahfyrBLqshrjJXPKfO+9Ar8wggdxMIIFWaAD
// SIG // AgECAhMzAAAAFcXna54Cm0mZAAAAAAAVMA0GCSqGSIb3
// SIG // DQEBCwUAMIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYD
// SIG // VQQDEylNaWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBB
// SIG // dXRob3JpdHkgMjAxMDAeFw0yMTA5MzAxODIyMjVaFw0z
// SIG // MDA5MzAxODMyMjVaMHwxCzAJBgNVBAYTAlVTMRMwEQYD
// SIG // VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25k
// SIG // MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24x
// SIG // JjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBD
// SIG // QSAyMDEwMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIIC
// SIG // CgKCAgEA5OGmTOe0ciELeaLL1yR5vQ7VgtP97pwHB9Kp
// SIG // bE51yMo1V/YBf2xK4OK9uT4XYDP/XE/HZveVU3Fa4n5K
// SIG // Wv64NmeFRiMMtY0Tz3cywBAY6GB9alKDRLemjkZrBxTz
// SIG // xXb1hlDcwUTIcVxRMTegCjhuje3XD9gmU3w5YQJ6xKr9
// SIG // cmmvHaus9ja+NSZk2pg7uhp7M62AW36MEBydUv626GIl
// SIG // 3GoPz130/o5Tz9bshVZN7928jaTjkY+yOSxRnOlwaQ3K
// SIG // Ni1wjjHINSi947SHJMPgyY9+tVSP3PoFVZhtaDuaRr3t
// SIG // pK56KTesy+uDRedGbsoy1cCGMFxPLOJiss254o2I5Jas
// SIG // AUq7vnGpF1tnYN74kpEeHT39IM9zfUGaRnXNxF803RKJ
// SIG // 1v2lIH1+/NmeRd+2ci/bfV+AutuqfjbsNkz2K26oElHo
// SIG // vwUDo9Fzpk03dJQcNIIP8BDyt0cY7afomXw/TNuvXsLz
// SIG // 1dhzPUNOwTM5TI4CvEJoLhDqhFFG4tG9ahhaYQFzymei
// SIG // XtcodgLiMxhy16cg8ML6EgrXY28MyTZki1ugpoMhXV8w
// SIG // dJGUlNi5UPkLiWHzNgY1GIRH29wb0f2y1BzFa/ZcUlFd
// SIG // Etsluq9QBXpsxREdcu+N+VLEhReTwDwV2xo3xwgVGD94
// SIG // q0W29R6HXtqPnhZyacaue7e3PmriLq0CAwEAAaOCAd0w
// SIG // ggHZMBIGCSsGAQQBgjcVAQQFAgMBAAEwIwYJKwYBBAGC
// SIG // NxUCBBYEFCqnUv5kxJq+gpE8RjUpzxD/LwTuMB0GA1Ud
// SIG // DgQWBBSfpxVdAF5iXYP05dJlpxtTNRnpcjBcBgNVHSAE
// SIG // VTBTMFEGDCsGAQQBgjdMg30BATBBMD8GCCsGAQUFBwIB
// SIG // FjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
// SIG // L0RvY3MvUmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYI
// SIG // KwYBBQUHAwgwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBD
// SIG // AEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8w
// SIG // HwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQw
// SIG // VgYDVR0fBE8wTTBLoEmgR4ZFaHR0cDovL2NybC5taWNy
// SIG // b3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9v
// SIG // Q2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEB
// SIG // BE4wTDBKBggrBgEFBQcwAoY+aHR0cDovL3d3dy5taWNy
// SIG // b3NvZnQuY29tL3BraS9jZXJ0cy9NaWNSb29DZXJBdXRf
// SIG // MjAxMC0wNi0yMy5jcnQwDQYJKoZIhvcNAQELBQADggIB
// SIG // AJ1VffwqreEsH2cBMSRb4Z5yS/ypb+pcFLY+TkdkeLEG
// SIG // k5c9MTO1OdfCcTY/2mRsfNB1OW27DzHkwo/7bNGhlBgi
// SIG // 7ulmZzpTTd2YurYeeNg2LpypglYAA7AFvonoaeC6Ce57
// SIG // 32pvvinLbtg/SHUB2RjebYIM9W0jVOR4U3UkV7ndn/OO
// SIG // PcbzaN9l9qRWqveVtihVJ9AkvUCgvxm2EhIRXT0n4ECW
// SIG // OKz3+SmJw7wXsFSFQrP8DJ6LGYnn8AtqgcKBGUIZUnWK
// SIG // NsIdw2FzLixre24/LAl4FOmRsqlb30mjdAy87JGA0j3m
// SIG // Sj5mO0+7hvoyGtmW9I/2kQH2zsZ0/fZMcm8Qq3UwxTSw
// SIG // ethQ/gpY3UA8x1RtnWN0SCyxTkctwRQEcb9k+SS+c23K
// SIG // jgm9swFXSVRk2XPXfx5bRAGOWhmRaw2fpCjcZxkoJLo4
// SIG // S5pu+yFUa2pFEUep8beuyOiJXk+d0tBMdrVXVAmxaQFE
// SIG // fnyhYWxz/gq77EFmPWn9y8FBSX5+k77L+DvktxW/tM4+
// SIG // pTFRhLy/AsGConsXHRWJjXD+57XQKBqJC4822rpM+Zv/
// SIG // Cuk0+CQ1ZyvgDbjmjJnW4SLq8CdCPSWU5nR0W2rRnj7t
// SIG // fqAxM328y+l7vzhwRNGQ8cirOoo6CGJ/2XBjU02N7oJt
// SIG // pQUQwXEGahC0HVUzWLOhcGbyoYIDVjCCAj4CAQEwggEB
// SIG // oYHZpIHWMIHTMQswCQYDVQQGEwJVUzETMBEGA1UECBMK
// SIG // V2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwG
// SIG // A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMS0wKwYD
// SIG // VQQLEyRNaWNyb3NvZnQgSXJlbGFuZCBPcGVyYXRpb25z
// SIG // IExpbWl0ZWQxJzAlBgNVBAsTHm5TaGllbGQgVFNTIEVT
// SIG // Tjo1OTFBLTA1RTAtRDk0NzElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaIjCgEBMAcGBSsO
// SIG // AwIaAxUA2RysX196RXLTwA/P8RFWdUTpUsaggYMwgYCk
// SIG // fjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1N
// SIG // aWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDANBgkq
// SIG // hkiG9w0BAQsFAAIFAOyhTk4wIhgPMjAyNTEwMjEwMDEx
// SIG // NThaGA8yMDI1MTAyMjAwMTE1OFowdDA6BgorBgEEAYRZ
// SIG // CgQBMSwwKjAKAgUA7KFOTgIBADAHAgEAAgIWMzAHAgEA
// SIG // AgIT2DAKAgUA7KKfzgIBADA2BgorBgEEAYRZCgQCMSgw
// SIG // JjAMBgorBgEEAYRZCgMCoAowCAIBAAIDB6EgoQowCAIB
// SIG // AAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQCEBywQxz7T
// SIG // nyqJOZx1fGS3XUm12mlaLtfwX8CdrD9IDNFwZUrN1/EE
// SIG // wUhrzQExdTZIQYdfE9pIWDc4kQIZvX3gLbNDaEAMoTaS
// SIG // IBQ4mCq7Dh3Q+LTZYOgQ08kI/WIlxeD1OhdKdnevBnXd
// SIG // LPbsuVDBof/rt4Yxx0rjCgUakm6KLS5vvdnDjMF6sTzl
// SIG // 8scg9STeXQyp6dBN3CKCsJmIGkBfIuTEsb61fIUE5eBJ
// SIG // jf9CpejmFqQMxUXVH0EYEuMvDxKNfaax8kUoBEKUoeZ0
// SIG // YLBXyLQ3CdFN7s0wDf4aSbyUcroQ8kbgjmTF8R+1ErMS
// SIG // WXrhXvWqzWL4V5Rccz+K3KpRMYIEDTCCBAkCAQEwgZMw
// SIG // fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
// SIG // b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1p
// SIG // Y3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTACEzMAAAIU
// SIG // jc0jRO4G33IAAQAAAhQwDQYJYIZIAWUDBAIBBQCgggFK
// SIG // MBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAvBgkq
// SIG // hkiG9w0BCQQxIgQgm5PtDZQbtm6cxEDmsw9QB8Wx2wyx
// SIG // S7IkN4ETv3RH6U4wgfoGCyqGSIb3DQEJEAIvMYHqMIHn
// SIG // MIHkMIG9BCA2eKvvWx5bcoi43bRO3+EttQUCvyeD2dbX
// SIG // y/6+0xK+xzCBmDCBgKR+MHwxCzAJBgNVBAYTAlVTMRMw
// SIG // EQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
// SIG // b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRp
// SIG // b24xJjAkBgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1w
// SIG // IFBDQSAyMDEwAhMzAAACFI3NI0TuBt9yAAEAAAIUMCIE
// SIG // IJQtnbXK+vefXXVt//F9eBMf4FqDM57Yc0w4aw9tguuc
// SIG // MA0GCSqGSIb3DQEBCwUABIICACNi18ny0TPSHPc1tUK/
// SIG // fiSfRFKxXZwXO48xN3qMLjcLPETS9BVofIn8pJCx9jtB
// SIG // qvn4/Er7Sqh2XtpuWj5J6lzp8QEl43ytGhrMjRXj608g
// SIG // 3nTiauPMhcuPONR67tFb323o514ZUN+sLunKQf73QjVo
// SIG // AskygX5N1vtWzZuyVGg9CCFv092nktuZYXENLy42zXCZ
// SIG // 2C9Dpraa1zzN+qhahv9g+e7npNVgySjTP7lnAoV7UXQz
// SIG // v73tyqZgicp6Lv5ELFYpPZTG5M+2qGarIhcAlDjsa+Bp
// SIG // ny/dBXlRoTPQ47tHWOQhENpJf1Up6cLSO5mfkrh4JAW2
// SIG // ESd0YsrIMknZsbleRwSsWt7O6K5aypHaBpkw1NDfL80k
// SIG // c4YryTnbO3JoFvV44WSRmiv1N0xICROA81+AqCg02hwJ
// SIG // wkAmhVi6ifkEqJwI3OLiaYukreTkEyeiGWLpN5CtzoQR
// SIG // HX7m6Y4jpVKfSzMoMqHyv3hABYiuDlX/8GyQ3qs2xzMX
// SIG // T73V8/hrACiYWuZiBA74YUyttxIrsk4sDkV4WOhlfGMF
// SIG // nXGpMC0rfrZfWB+wQyljXwuRK1ZECfM9FocT2G/tkj/t
// SIG // de785fllOdb2u02K6FsNN16cBltHrhSGKHUy89+vILzV
// SIG // q8aUhX2Y4t4jxmtqUWuOErU0BiE5sFH55LTHWdG27Gff
// SIG // +FTB
// SIG // End signature block
