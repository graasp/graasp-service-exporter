# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.6.3](https://github.com/graasp/graasp-service-exporter/compare/v0.6.2...v0.6.3) (2019-11-26)

### Bug Fixes

- skip login for anonymous ilss ([bef01ee](https://github.com/graasp/graasp-service-exporter/commit/bef01ee375ff84bb31eb13098ecef84d5d5fb9f0)), closes [#88](https://github.com/graasp/graasp-service-exporter/issues/88)

## [0.6.2](https://github.com/graasp/graasp-service-exporter/compare/v0.6.1...v0.6.2) (2019-10-18)

### Bug Fixes

- update test docker version ([b0fad62](https://github.com/graasp/graasp-service-exporter/commit/b0fad62f9586aa66e083a0e818a0130a747ceb18))

## [0.6.1](https://github.com/graasp/graasp-service-exporter/compare/v0.6.0...v0.6.1) (2019-10-18)

### Bug Fixes

- increase memory size to maximum ([2cf97c4](https://github.com/graasp/graasp-service-exporter/commit/2cf97c4e38f37af8578fc55a31853e0096db7c61)), closes [#87](https://github.com/graasp/graasp-service-exporter/issues/87)

# [0.6.0](https://github.com/graasp/graasp-service-exporter/compare/v0.5.0...v0.6.0) (2019-08-06)

### Bug Fixes

- handle back cover if there is no main description ([a3b9b8d](https://github.com/graasp/graasp-service-exporter/commit/a3b9b8d))
- ignore back cover data for png and pdf exports ([1d13cc8](https://github.com/graasp/graasp-service-exporter/commit/1d13cc8))

### Features

- generate single back cover for multi ils export ([8754946](https://github.com/graasp/graasp-service-exporter/commit/8754946)), closes [#80](https://github.com/graasp/graasp-service-exporter/issues/80)

# [0.5.0](https://github.com/graasp/graasp-service-exporter/compare/v0.4.2...v0.5.0) (2019-07-17)

### Bug Fixes

- increase timeout to properly load apps content ([b13860d](https://github.com/graasp/graasp-service-exporter/commit/b13860d)), closes [#66](https://github.com/graasp/graasp-service-exporter/issues/66)
- increase timeout to properly load apps content ([f8fce0f](https://github.com/graasp/graasp-service-exporter/commit/f8fce0f)), closes [#66](https://github.com/graasp/graasp-service-exporter/issues/66)
- rebase for pull request ([be02fc6](https://github.com/graasp/graasp-service-exporter/commit/be02fc6))
- receives space ids as array, update epub-gen package ([46f965d](https://github.com/graasp/graasp-service-exporter/commit/46f965d))
- receives space ids as array, update epub-gen package ([9875bcf](https://github.com/graasp/graasp-service-exporter/commit/9875bcf))

### Features

- add back cover content ([dc2ab1d](https://github.com/graasp/graasp-service-exporter/commit/dc2ab1d)), closes [#60](https://github.com/graasp/graasp-service-exporter/issues/60)
- add back cover content ([f1b7db5](https://github.com/graasp/graasp-service-exporter/commit/f1b7db5)), closes [#60](https://github.com/graasp/graasp-service-exporter/issues/60)
- export multiple ils ([3464cb6](https://github.com/graasp/graasp-service-exporter/commit/3464cb6)), closes [#67](https://github.com/graasp/graasp-service-exporter/issues/67)
- export multiple ils ([f7387fd](https://github.com/graasp/graasp-service-exporter/commit/f7387fd)), closes [#67](https://github.com/graasp/graasp-service-exporter/issues/67)
- multiple space export displaying all covers ([2ec8e4f](https://github.com/graasp/graasp-service-exporter/commit/2ec8e4f)), closes [#67](https://github.com/graasp/graasp-service-exporter/issues/67)
- multiple space export displaying all covers ([c4615f6](https://github.com/graasp/graasp-service-exporter/commit/c4615f6)), closes [#67](https://github.com/graasp/graasp-service-exporter/issues/67)
- multiple space export displaying all covers ([d5bd4aa](https://github.com/graasp/graasp-service-exporter/commit/d5bd4aa)), closes [#67](https://github.com/graasp/graasp-service-exporter/issues/67)

## [0.4.2](https://github.com/graasp/graasp-service-exporter/compare/v0.4.1...v0.4.2) (2019-06-21)

### Bug Fixes

- use separate timeout for elements and login ([dc768a5](https://github.com/graasp/graasp-service-exporter/commit/dc768a5))

## [0.4.1](https://github.com/graasp/graasp-service-exporter/compare/v0.4.0...v0.4.1) (2019-06-21)

### Bug Fixes

- allow (dev\.)?graasp\.eu as a referrer ([f840617](https://github.com/graasp/graasp-service-exporter/commit/f840617))
- allow (dev\.)?graasp\.eu as an origin ([51da43b](https://github.com/graasp/graasp-service-exporter/commit/51da43b))
- fix bug splitting regex ([22fbdbb](https://github.com/graasp/graasp-service-exporter/commit/22fbdbb))
- set elements timeout to thirty seconds ([c79de6a](https://github.com/graasp/graasp-service-exporter/commit/c79de6a))

# [0.4.0](https://github.com/graasp/graasp-service-exporter/compare/v0.3.3...v0.4.0) (2019-06-20)

### Features

- allow dry-run flag ([32e237d](https://github.com/graasp/graasp-service-exporter/commit/32e237d)), closes [#61](https://github.com/graasp/graasp-service-exporter/issues/61)

## [0.3.3](https://github.com/graasp/graasp-service-exporter/compare/v0.3.2...v0.3.3) (2019-06-07)

### Bug Fixes

- change unauthorized resources into screenshots ([7a5ca49](https://github.com/graasp/graasp-service-exporter/commit/7a5ca49)), closes [#56](https://github.com/graasp/graasp-service-exporter/issues/56)
- expose location header ([3a5c977](https://github.com/graasp/graasp-service-exporter/commit/3a5c977)), closes [#55](https://github.com/graasp/graasp-service-exporter/issues/55)

## [0.3.2](https://github.com/graasp/graasp-service-exporter/compare/v0.3.1...v0.3.2) (2019-05-31)

### Bug Fixes

- encrypt missing environment variables ([d481f1e](https://github.com/graasp/graasp-service-exporter/commit/d481f1e)), closes [#54](https://github.com/graasp/graasp-service-exporter/issues/54)

## [0.3.1](https://github.com/graasp/graasp-service-exporter/compare/v0.3.0...v0.3.1) (2019-05-31)

### Bug Fixes

- fix missing sentry-cli binary ([d81d45e](https://github.com/graasp/graasp-service-exporter/commit/d81d45e))

# [0.3.0](https://github.com/graasp/graasp-service-exporter/compare/v0.2.0...v0.3.0) (2019-05-31)

### Bug Fixes

- add forked epub-gen to dependencies ([517e4f6](https://github.com/graasp/graasp-service-exporter/commit/517e4f6)), closes [#26](https://github.com/graasp/graasp-service-exporter/issues/26)
- add missing environment variables ([c4ad035](https://github.com/graasp/graasp-service-exporter/commit/c4ad035))
- blank screenshots ([96b99f3](https://github.com/graasp/graasp-service-exporter/commit/96b99f3)), closes [#44](https://github.com/graasp/graasp-service-exporter/issues/44)
- fix issues with cors and epub-gen ([a36706d](https://github.com/graasp/graasp-service-exporter/commit/a36706d)), closes [#50](https://github.com/graasp/graasp-service-exporter/issues/50)
- fix issues with writing of environment files in codeship ([b716172](https://github.com/graasp/graasp-service-exporter/commit/b716172))
- fix offline labs error ([3382897](https://github.com/graasp/graasp-service-exporter/commit/3382897)), closes [#43](https://github.com/graasp/graasp-service-exporter/issues/43)
- toggle parameters, refactor, jest coverage as scripty ([ec57a7e](https://github.com/graasp/graasp-service-exporter/commit/ec57a7e))
- use default cover background link for cover page ([6b06ea1](https://github.com/graasp/graasp-service-exporter/commit/6b06ea1)), closes [#29](https://github.com/graasp/graasp-service-exporter/issues/29)
- use https protocol when retrieving cover image url ([dde64dc](https://github.com/graasp/graasp-service-exporter/commit/dde64dc))

### Features

- add interactive option for epub export (except embedded html) ([4b5e9e0](https://github.com/graasp/graasp-service-exporter/commit/4b5e9e0))
- add interactive youtube embed and unsupported div screenshots ([d3ad096](https://github.com/graasp/graasp-service-exporter/commit/d3ad096)), closes [#21](https://github.com/graasp/graasp-service-exporter/issues/21)
- add mode option: static/offline/interactive ([3c0782f](https://github.com/graasp/graasp-service-exporter/commit/3c0782f)), closes [#37](https://github.com/graasp/graasp-service-exporter/issues/37)
- add one-file lab as interactive iframe (tbc) ([f5f2924](https://github.com/graasp/graasp-service-exporter/commit/f5f2924))
- add styles.css file, copy this file in dist when building ([1e2dbd5](https://github.com/graasp/graasp-service-exporter/commit/1e2dbd5)), closes [#32](https://github.com/graasp/graasp-service-exporter/issues/32)
- add styles.css file, copy this file in dist when building ([2a1314e](https://github.com/graasp/graasp-service-exporter/commit/2a1314e)), closes [#32](https://github.com/graasp/graasp-service-exporter/issues/32)
- generate cover image for epub export ([eb45278](https://github.com/graasp/graasp-service-exporter/commit/eb45278)), closes [#24](https://github.com/graasp/graasp-service-exporter/issues/24)
- generate cover image for epub export ([6d9561e](https://github.com/graasp/graasp-service-exporter/commit/6d9561e)), closes [#24](https://github.com/graasp/graasp-service-exporter/issues/24)
- handle cloud and viewer origin cases ([b39493b](https://github.com/graasp/graasp-service-exporter/commit/b39493b)), closes [#48](https://github.com/graasp/graasp-service-exporter/issues/48)
- handle objects, labs iframe, audios elements (screenshots vs tag) ([d4f1046](https://github.com/graasp/graasp-service-exporter/commit/d4f1046)), closes [#33](https://github.com/graasp/graasp-service-exporter/issues/33)
- login to pages view ([39101e0](https://github.com/graasp/graasp-service-exporter/commit/39101e0)), closes [#12](https://github.com/graasp/graasp-service-exporter/issues/12)
- scrape correctly page views phases ([700c544](https://github.com/graasp/graasp-service-exporter/commit/700c544)), closes [#18](https://github.com/graasp/graasp-service-exporter/issues/18)
- use background url from pages view ([36b04ce](https://github.com/graasp/graasp-service-exporter/commit/36b04ce))
- use background url from pages view ([a9c72c9](https://github.com/graasp/graasp-service-exporter/commit/a9c72c9))
- use css styles file, scrape phase description ([83b5ce0](https://github.com/graasp/graasp-service-exporter/commit/83b5ce0)), closes [#31](https://github.com/graasp/graasp-service-exporter/issues/31)
- use css styles file, scrape phase description ([d9a3f62](https://github.com/graasp/graasp-service-exporter/commit/d9a3f62)), closes [#31](https://github.com/graasp/graasp-service-exporter/issues/31)
- use lang to export corresponding offline lab content ([226e03b](https://github.com/graasp/graasp-service-exporter/commit/226e03b)), closes [#38](https://github.com/graasp/graasp-service-exporter/issues/38)
- **cover:** write date, username and generated sentence ([d00c66c](https://github.com/graasp/graasp-service-exporter/commit/d00c66c)), closes [#42](https://github.com/graasp/graasp-service-exporter/issues/42)

# [0.2.0](https://github.com/graasp/graasp-service-exporter/compare/v0.1.0...v0.2.0) (2019-03-25)

### Bug Fixes

- make sns topics specific to a stage ([ccd48c5](https://github.com/graasp/graasp-service-exporter/commit/ccd48c5)), closes [#15](https://github.com/graasp/graasp-service-exporter/issues/15)

### Features

- allow deployment to custom domain ([708b901](https://github.com/graasp/graasp-service-exporter/commit/708b901)), closes [#14](https://github.com/graasp/graasp-service-exporter/issues/14)
- log errors with sentry ([7e1da6a](https://github.com/graasp/graasp-service-exporter/commit/7e1da6a)), closes [#16](https://github.com/graasp/graasp-service-exporter/issues/16)
- use serverless s3 for offline use ([48fe9e0](https://github.com/graasp/graasp-service-exporter/commit/48fe9e0)), closes [#13](https://github.com/graasp/graasp-service-exporter/issues/13)

# 0.1.0 (2019-03-20)

### Bug Fixes

- fix issue with serverless-offline-sns ([cda7ecf](https://github.com/graasp/graasp-service-exporter/commit/cda7ecf)), closes [mj1618/serverless-offline-sns#61](https://github.com/mj1618/serverless-offline-sns/issues/61) [#4](https://github.com/graasp/graasp-service-exporter/issues/4)
- provide folder for temporary files ([bd43a20](https://github.com/graasp/graasp-service-exporter/commit/bd43a20)), closes [#5](https://github.com/graasp/graasp-service-exporter/issues/5)
- use port environment variables correctly ([d9201fe](https://github.com/graasp/graasp-service-exporter/commit/d9201fe)), closes [#6](https://github.com/graasp/graasp-service-exporter/issues/6)

### Features

- allow all functions to be called through lambda infrastructure ([1597aa4](https://github.com/graasp/graasp-service-exporter/commit/1597aa4)), closes [#1](https://github.com/graasp/graasp-service-exporter/issues/1)
- allow service to run offline ([a334c99](https://github.com/graasp/graasp-service-exporter/commit/a334c99)), closes [#3](https://github.com/graasp/graasp-service-exporter/issues/3)
