// Get Selenium and the drivers
/* istanbul ignore next */
var seleniumServer = require('selenium-server');
/* istanbul ignore next */
var chromedriver = require('chromedriver');
/* istanbul ignore next */
var geckodriver = require('geckodriver');

/* istanbul ignore next */
var config = {
    src_folders: [
        // Folders with tests
        'src/test/acceptance',
    ],
    output_folder: 'src/test/acceptance/output', // Where to output the test reports
    selenium: {
        // Information for selenium, such as the location of the drivers ect.
        start_process: true,
        server_path: seleniumServer.path,
        port: 4444, // Standard selenium port
        cli_args: {
            'webdriver.chrome.driver': chromedriver.path,
            'webdriver.gecko.driver': geckodriver.path,
        },
    },
    test_workers: {
        // This allows more then one browser to be opened and tested in at once
        enabled: false,
        workers: 'auto',
    },
    test_settings: {
        default: {
            selenium_port: 4444,
            selenium_host: 'localhost',
            screenshots: {
                enabled: false,
            },
            globals: {
                // How long to wait (in milliseconds) before the test times out
                waitForConditionTimeout: 5000,
            },
            desiredCapabilities: {
                // The default test
                browserName: 'chrome',
                javascriptEnabled: true,
                acceptSslCerts: true,
                nativeEvents: true,
            },
        },
        // Here, we give each of the browsers we want to test in, and their driver configuration
        chrome: {
            desiredCapabilities: {
                browserName: 'chrome',
                javascriptEnabled: true,
                acceptSslCerts: true,
                nativeEvents: true,
                chromeOptions: {
                    'args': [ 'disable-gpu', 'no-sandbox', 'headless', 'window-size=1920,1080', 'verbose' ],
                },
            },
        },
        firefox: {
            desiredCapabilities: {
                browserName: 'firefox',
                javascriptEnabled: true,
                acceptSslCerts: true,
                marionette: true,
                nativeEvents: true,
                acceptInsecureCerts: true,
            },
        },
        safari: {
            desiredCapabilities: {
                browserName: 'safari',
                javascriptEnabled: true,
                acceptSslCerts: true,
                nativeEvents: true,
            },
        },
    },
};
/* istanbul ignore next */
module.exports = config;