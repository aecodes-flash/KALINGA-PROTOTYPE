/* qrcode-generator 1.4.4 (MIT), inlined so the poster works offline */
  //---------------------------------------------------------------------
  //
  // QR Code Generator for JavaScript
  //
  // Copyright (c) 2009 Kazuhiko Arase
  //
  // URL: http://www.d-project.com/
  //
  // Licensed under the MIT license:
  //  http://www.opensource.org/licenses/mit-license.php
  //
  // The word 'QR Code' is registered trademark of
  // DENSO WAVE INCORPORATED
  //  http://www.denso-wave.com/qrcode/faqpatent-e.html
  //
  //---------------------------------------------------------------------

  var qrcode = function() {

    //---------------------------------------------------------------------
    // qrcode
    //---------------------------------------------------------------------

    /**
     * qrcode
     * @param typeNumber 1 to 40
     * @param errorCorrectionLevel 'L','M','Q','H'
     */
    var qrcode = function(typeNumber, errorCorrectionLevel) {

      var PAD0 = 0xEC;
      var PAD1 = 0x11;

      var _typeNumber = typeNumber;
      var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
      var _modules = null;
      var _moduleCount = 0;
      var _dataCache = null;
      var _dataList = [];

      var _this = {};

      var makeImpl = function(test, maskPattern) {

        _moduleCount = _typeNumber * 4 + 17;
        _modules = function(moduleCount) {
          var modules = new Array(moduleCount);
          for (var row = 0; row < moduleCount; row += 1) {
            modules[row] = new Array(moduleCount);
            for (var col = 0; col < moduleCount; col += 1) {
              modules[row][col] = null;
            }
          }
          return modules;
        }(_moduleCount);

        setupPositionProbePattern(0, 0);
        setupPositionProbePattern(_moduleCount - 7, 0);
        setupPositionProbePattern(0, _moduleCount - 7);
        setupPositionAdjustPattern();
        setupTimingPattern();
        setupTypeInfo(test, maskPattern);

        if (_typeNumber >= 7) {
          setupTypeNumber(test);
        }

        if (_dataCache == null) {
          _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
        }

        mapData(_dataCache, maskPattern);
      };

      var setupPositionProbePattern = function(row, col) {

        for (var r = -1; r <= 7; r += 1) {

          if (row + r <= -1 || _moduleCount <= row + r) continue;

          for (var c = -1; c <= 7; c += 1) {

            if (col + c <= -1 || _moduleCount <= col + c) continue;

            if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
                || (0 <= c && c <= 6 && (r == 0 || r == 6) )
                || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
              _modules[row + r][col + c] = true;
            } else {
              _modules[row + r][col + c] = false;
            }
          }
        }
      };

      var getBestMaskPattern = function() {

        var minLostPoint = 0;
        var pattern = 0;

        for (var i = 0; i < 8; i += 1) {

          makeImpl(true, i);

          var lostPoint = QRUtil.getLostPoint(_this);

          if (i == 0 || minLostPoint > lostPoint) {
            minLostPoint = lostPoint;
            pattern = i;
          }
        }

        return pattern;
      };

      var setupTimingPattern = function() {

        for (var r = 8; r < _moduleCount - 8; r += 1) {
          if (_modules[r][6] != null) {
            continue;
          }
          _modules[r][6] = (r % 2 == 0);
        }

        for (var c = 8; c < _moduleCount - 8; c += 1) {
          if (_modules[6][c] != null) {
            continue;
          }
          _modules[6][c] = (c % 2 == 0);
        }
      };

      var setupPositionAdjustPattern = function() {

        var pos = QRUtil.getPatternPosition(_typeNumber);

        for (var i = 0; i < pos.length; i += 1) {

          for (var j = 0; j < pos.length; j += 1) {

            var row = pos[i];
            var col = pos[j];

            if (_modules[row][col] != null) {
              continue;
            }

            for (var r = -2; r <= 2; r += 1) {

              for (var c = -2; c <= 2; c += 1) {

                if (r == -2 || r == 2 || c == -2 || c == 2
                    || (r == 0 && c == 0) ) {
                  _modules[row + r][col + c] = true;
                } else {
                  _modules[row + r][col + c] = false;
                }
              }
            }
          }
        }
      };

      var setupTypeNumber = function(test) {

        var bits = QRUtil.getBCHTypeNumber(_typeNumber);

        for (var i = 0; i < 18; i += 1) {
          var mod = (!test && ( (bits >> i) & 1) == 1);
          _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
        }

        for (var i = 0; i < 18; i += 1) {
          var mod = (!test && ( (bits >> i) & 1) == 1);
          _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
        }
      };

      var setupTypeInfo = function(test, maskPattern) {

        var data = (_errorCorrectionLevel << 3) | maskPattern;
        var bits = QRUtil.getBCHTypeInfo(data);

        // vertical
        for (var i = 0; i < 15; i += 1) {

          var mod = (!test && ( (bits >> i) & 1) == 1);

          if (i < 6) {
            _modules[i][8] = mod;
          } else if (i < 8) {
            _modules[i + 1][8] = mod;
          } else {
            _modules[_moduleCount - 15 + i][8] = mod;
          }
        }

        // horizontal
        for (var i = 0; i < 15; i += 1) {

          var mod = (!test && ( (bits >> i) & 1) == 1);

          if (i < 8) {
            _modules[8][_moduleCount - i - 1] = mod;
          } else if (i < 9) {
            _modules[8][15 - i - 1 + 1] = mod;
          } else {
            _modules[8][15 - i - 1] = mod;
          }
        }

        // fixed module
        _modules[_moduleCount - 8][8] = (!test);
      };

      var mapData = function(data, maskPattern) {

        var inc = -1;
        var row = _moduleCount - 1;
        var bitIndex = 7;
        var byteIndex = 0;
        var maskFunc = QRUtil.getMaskFunction(maskPattern);

        for (var col = _moduleCount - 1; col > 0; col -= 2) {

          if (col == 6) col -= 1;

          while (true) {

            for (var c = 0; c < 2; c += 1) {

              if (_modules[row][col - c] == null) {

                var dark = false;

                if (byteIndex < data.length) {
                  dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
                }

                var mask = maskFunc(row, col - c);

                if (mask) {
                  dark = !dark;
                }

                _modules[row][col - c] = dark;
                bitIndex -= 1;

                if (bitIndex == -1) {
                  byteIndex += 1;
                  bitIndex = 7;
                }
              }
            }

            row += inc;

            if (row < 0 || _moduleCount <= row) {
              row -= inc;
              inc = -inc;
              break;
            }
          }
        }
      };

      var createBytes = function(buffer, rsBlocks) {

        var offset = 0;

        var maxDcCount = 0;
        var maxEcCount = 0;

        var dcdata = new Array(rsBlocks.length);
        var ecdata = new Array(rsBlocks.length);

        for (var r = 0; r < rsBlocks.length; r += 1) {

          var dcCount = rsBlocks[r].dataCount;
          var ecCount = rsBlocks[r].totalCount - dcCount;

          maxDcCount = Math.max(maxDcCount, dcCount);
          maxEcCount = Math.max(maxEcCount, ecCount);

          dcdata[r] = new Array(dcCount);

          for (var i = 0; i < dcdata[r].length; i += 1) {
            dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
          }
          offset += dcCount;

          var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
          var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

          var modPoly = rawPoly.mod(rsPoly);
          ecdata[r] = new Array(rsPoly.getLength() - 1);
          for (var i = 0; i < ecdata[r].length; i += 1) {
            var modIndex = i + modPoly.getLength() - ecdata[r].length;
            ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
          }
        }

        var totalCodeCount = 0;
        for (var i = 0; i < rsBlocks.length; i += 1) {
          totalCodeCount += rsBlocks[i].totalCount;
        }

        var data = new Array(totalCodeCount);
        var index = 0;

        for (var i = 0; i < maxDcCount; i += 1) {
          for (var r = 0; r < rsBlocks.length; r += 1) {
            if (i < dcdata[r].length) {
              data[index] = dcdata[r][i];
              index += 1;
            }
          }
        }

        for (var i = 0; i < maxEcCount; i += 1) {
          for (var r = 0; r < rsBlocks.length; r += 1) {
            if (i < ecdata[r].length) {
              data[index] = ecdata[r][i];
              index += 1;
            }
          }
        }

        return data;
      };

      var createData = function(typeNumber, errorCorrectionLevel, dataList) {

        var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

        var buffer = qrBitBuffer();

        for (var i = 0; i < dataList.length; i += 1) {
          var data = dataList[i];
          buffer.put(data.getMode(), 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
          data.write(buffer);
        }

        // calc num max data.
        var totalDataCount = 0;
        for (var i = 0; i < rsBlocks.length; i += 1) {
          totalDataCount += rsBlocks[i].dataCount;
        }

        if (buffer.getLengthInBits() > totalDataCount * 8) {
          throw 'code length overflow. ('
            + buffer.getLengthInBits()
            + '>'
            + totalDataCount * 8
            + ')';
        }

        // end code
        if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
          buffer.put(0, 4);
        }

        // padding
        while (buffer.getLengthInBits() % 8 != 0) {
          buffer.putBit(false);
        }

        // padding
        while (true) {

          if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
          }
          buffer.put(PAD0, 8);

          if (buffer.getLengthInBits() >= totalDataCount * 8) {
            break;
          }
          buffer.put(PAD1, 8);
        }

        return createBytes(buffer, rsBlocks);
      };

      _this.addData = function(data, mode) {

        mode = mode || 'Byte';

        var newData = null;

        switch(mode) {
        case 'Numeric' :
          newData = qrNumber(data);
          break;
        case 'Alphanumeric' :
          newData = qrAlphaNum(data);
          break;
        case 'Byte' :
          newData = qr8BitByte(data);
          break;
        case 'Kanji' :
          newData = qrKanji(data);
          break;
        default :
          throw 'mode:' + mode;
        }

        _dataList.push(newData);
        _dataCache = null;
      };

      _this.isDark = function(row, col) {
        if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
          throw row + ',' + col;
        }
        return _modules[row][col];
      };

      _this.getModuleCount = function() {
        return _moduleCount;
      };

      _this.make = function() {
        if (_typeNumber < 1) {
          var typeNumber = 1;

          for (; typeNumber < 40; typeNumber++) {
            var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
            var buffer = qrBitBuffer();

            for (var i = 0; i < _dataList.length; i++) {
              var data = _dataList[i];
              buffer.put(data.getMode(), 4);
              buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
              data.write(buffer);
            }

            var totalDataCount = 0;
            for (var i = 0; i < rsBlocks.length; i++) {
              totalDataCount += rsBlocks[i].dataCount;
            }

            if (buffer.getLengthInBits() <= totalDataCount * 8) {
              break;
            }
          }

          _typeNumber = typeNumber;
        }

        makeImpl(false, getBestMaskPattern() );
      };

      _this.createTableTag = function(cellSize, margin) {

        cellSize = cellSize || 2;
        margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

        var qrHtml = '';

        qrHtml += '<table style="';
        qrHtml += ' border-width: 0px; border-style: none;';
        qrHtml += ' border-collapse: collapse;';
        qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
        qrHtml += '">';
        qrHtml += '<tbody>';

        for (var r = 0; r < _this.getModuleCount(); r += 1) {

          qrHtml += '<tr>';

          for (var c = 0; c < _this.getModuleCount(); c += 1) {
            qrHtml += '<td style="';
            qrHtml += ' border-width: 0px; border-style: none;';
            qrHtml += ' border-collapse: collapse;';
            qrHtml += ' padding: 0px; margin: 0px;';
            qrHtml += ' width: ' + cellSize + 'px;';
            qrHtml += ' height: ' + cellSize + 'px;';
            qrHtml += ' background-color: ';
            qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
            qrHtml += ';';
            qrHtml += '"/>';
          }

          qrHtml += '</tr>';
        }

        qrHtml += '</tbody>';
        qrHtml += '</table>';

        return qrHtml;
      };

      _this.createSvgTag = function(cellSize, margin, alt, title) {

        var opts = {};
        if (typeof arguments[0] == 'object') {
          // Called by options.
          opts = arguments[0];
          // overwrite cellSize and margin.
          cellSize = opts.cellSize;
          margin = opts.margin;
          alt = opts.alt;
          title = opts.title;
        }

        cellSize = cellSize || 2;
        margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

        // Compose alt property surrogate
        alt = (typeof alt === 'string') ? {text: alt} : alt || {};
        alt.text = alt.text || null;
        alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

        // Compose title property surrogate
        title = (typeof title === 'string') ? {text: title} : title || {};
        title.text = title.text || null;
        title.id = (title.text) ? title.id || 'qrcode-title' : null;

        var size = _this.getModuleCount() * cellSize + margin * 2;
        var c, mc, r, mr, qrSvg='', rect;

        rect = 'l' + cellSize + ',0 0,' + cellSize +
          ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

        qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
        qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
        qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
        qrSvg += ' preserveAspectRatio="xMinYMin meet"';
        qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
            escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
        qrSvg += '>';
        qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
            escapeXml(title.text) + '</title>' : '';
        qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
            escapeXml(alt.text) + '</description>' : '';
        qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
        qrSvg += '<path d="';

        for (r = 0; r < _this.getModuleCount(); r += 1) {
          mr = r * cellSize + margin;
          for (c = 0; c < _this.getModuleCount(); c += 1) {
            if (_this.isDark(r, c) ) {
              mc = c*cellSize+margin;
              qrSvg += 'M' + mc + ',' + mr + rect;
            }
          }
        }

        qrSvg += '" stroke="transparent" fill="black"/>';
        qrSvg += '</svg>';

        return qrSvg;
      };

      _this.createDataURL = function(cellSize, margin) {

        cellSize = cellSize || 2;
        margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

        var size = _this.getModuleCount() * cellSize + margin * 2;
        var min = margin;
        var max = size - margin;

        return createDataURL(size, size, function(x, y) {
          if (min <= x && x < max && min <= y && y < max) {
            var c = Math.floor( (x - min) / cellSize);
            var r = Math.floor( (y - min) / cellSize);
            return _this.isDark(r, c)? 0 : 1;
          } else {
            return 1;
          }
        } );
      };

      _this.createImgTag = function(cellSize, margin, alt) {

        cellSize = cellSize || 2;
        margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

        var size = _this.getModuleCount() * cellSize + margin * 2;

        var img = '';
        img += '<img';
        img += '\u0020src="';
        img += _this.createDataURL(cellSize, margin);
        img += '"';
        img += '\u0020width="';
        img += size;
        img += '"';
        img += '\u0020height="';
        img += size;
        img += '"';
        if (alt) {
          img += '\u0020alt="';
          img += escapeXml(alt);
          img += '"';
        }
        img += '/>';

        return img;
      };

      var escapeXml = function(s) {
        var escaped = '';
        for (var i = 0; i < s.length; i += 1) {
          var c = s.charAt(i);
          switch(c) {
          case '<': escaped += '&lt;'; break;
          case '>': escaped += '&gt;'; break;
          case '&': escaped += '&amp;'; break;
          case '"': escaped += '&quot;'; break;
          default : escaped += c; break;
          }
        }
        return escaped;
      };

      var _createHalfASCII = function(margin) {
        var cellSize = 1;
        margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

        var size = _this.getModuleCount() * cellSize + margin * 2;
        var min = margin;
        var max = size - margin;

        var y, x, r1, r2, p;

        var blocks = {
          '██': '█',
          '█ ': '▀',
          ' █': '▄',
          '  ': ' '
        };

        var blocksLastLineNoMargin = {
          '██': '▀',
          '█ ': '▀',
          ' █': ' ',
          '  ': ' '
        };

        var ascii = '';
        for (y = 0; y < size; y += 2) {
          r1 = Math.floor((y - min) / cellSize);
          r2 = Math.floor((y + 1 - min) / cellSize);
          for (x = 0; x < size; x += 1) {
            p = '█';

            if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
              p = ' ';
            }

            if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
              p += ' ';
            }
            else {
              p += '█';
            }

            // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
            ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
          }

          ascii += '\n';
        }

        if (size % 2 && margin > 0) {
          return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
        }

        return ascii.substring(0, ascii.length-1);
      };

      _this.createASCII = function(cellSize, margin) {
        cellSize = cellSize || 1;

        if (cellSize < 2) {
          return _createHalfASCII(margin);
        }

        cellSize -= 1;
        margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

        var size = _this.getModuleCount() * cellSize + margin * 2;
        var min = margin;
        var max = size - margin;

        var y, x, r, p;

        var white = Array(cellSize+1).join('██');
        var black = Array(cellSize+1).join('  ');

        var ascii = '';
        var line = '';
        for (y = 0; y < size; y += 1) {
          r = Math.floor( (y - min) / cellSize);
          line = '';
          for (x = 0; x < size; x += 1) {
            p = 1;

            if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
              p = 0;
            }

            // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
            line += p ? white : black;
          }

          for (r = 0; r < cellSize; r += 1) {
            ascii += line + '\n';
          }
        }

        return ascii.substring(0, ascii.length-1);
      };

      _this.renderTo2dContext = function(context, cellSize) {
        cellSize = cellSize || 2;
        var length = _this.getModuleCount();
        for (var row = 0; row < length; row++) {
          for (var col = 0; col < length; col++) {
            context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
            context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
          }
        }
      }

      return _this;
    };

    //---------------------------------------------------------------------
    // qrcode.stringToBytes
    //---------------------------------------------------------------------

    qrcode.stringToBytesFuncs = {
      'default' : function(s) {
        var bytes = [];
        for (var i = 0; i < s.length; i += 1) {
          var c = s.charCodeAt(i);
          bytes.push(c & 0xff);
        }
        return bytes;
      }
    };

    qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

    //---------------------------------------------------------------------
    // qrcode.createStringToBytes
    //---------------------------------------------------------------------

    /**
     * @param unicodeData base64 string of byte array.
     * [16bit Unicode],[16bit Bytes], ...
     * @param numChars
     */
    qrcode.createStringToBytes = function(unicodeData, numChars) {

      // create conversion map.

      var unicodeMap = function() {

        var bin = base64DecodeInputStream(unicodeData);
        var read = function() {
          var b = bin.read();
          if (b == -1) throw 'eof';
          return b;
        };

        var count = 0;
        var unicodeMap = {};
        while (true) {
          var b0 = bin.read();
          if (b0 == -1) break;
          var b1 = read();
          var b2 = read();
          var b3 = read();
          var k = String.fromCharCode( (b0 << 8) | b1);
          var v = (b2 << 8) | b3;
          unicodeMap[k] = v;
          count += 1;
        }
        if (count != numChars) {
          throw count + ' != ' + numChars;
        }

        return unicodeMap;
      }();

      var unknownChar = '?'.charCodeAt(0);

      return function(s) {
        var bytes = [];
        for (var i = 0; i < s.length; i += 1) {
          var c = s.charCodeAt(i);
          if (c < 128) {
            bytes.push(c);
          } else {
            var b = unicodeMap[s.charAt(i)];
            if (typeof b == 'number') {
              if ( (b & 0xff) == b) {
                // 1byte
                bytes.push(b);
              } else {
                // 2bytes
                bytes.push(b >>> 8);
                bytes.push(b & 0xff);
              }
            } else {
              bytes.push(unknownChar);
            }
          }
        }
        return bytes;
      };
    };

    //---------------------------------------------------------------------
    // QRMode
    //---------------------------------------------------------------------

    var QRMode = {
      MODE_NUMBER :    1 << 0,
      MODE_ALPHA_NUM : 1 << 1,
      MODE_8BIT_BYTE : 1 << 2,
      MODE_KANJI :     1 << 3
    };

    //---------------------------------------------------------------------
    // QRErrorCorrectionLevel
    //---------------------------------------------------------------------

    var QRErrorCorrectionLevel = {
      L : 1,
      M : 0,
      Q : 3,
      H : 2
    };

    //---------------------------------------------------------------------
    // QRMaskPattern
    //---------------------------------------------------------------------

    var QRMaskPattern = {
      PATTERN000 : 0,
      PATTERN001 : 1,
      PATTERN010 : 2,
      PATTERN011 : 3,
      PATTERN100 : 4,
      PATTERN101 : 5,
      PATTERN110 : 6,
      PATTERN111 : 7
    };

    //---------------------------------------------------------------------
    // QRUtil
    //---------------------------------------------------------------------

    var QRUtil = function() {

      var PATTERN_POSITION_TABLE = [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50],
        [6, 30, 54],
        [6, 32, 58],
        [6, 34, 62],
        [6, 26, 46, 66],
        [6, 26, 48, 70],
        [6, 26, 50, 74],
        [6, 30, 54, 78],
        [6, 30, 56, 82],
        [6, 30, 58, 86],
        [6, 34, 62, 90],
        [6, 28, 50, 72, 94],
        [6, 26, 50, 74, 98],
        [6, 30, 54, 78, 102],
        [6, 28, 54, 80, 106],
        [6, 32, 58, 84, 110],
        [6, 30, 58, 86, 114],
        [6, 34, 62, 90, 118],
        [6, 26, 50, 74, 98, 122],
        [6, 30, 54, 78, 102, 126],
        [6, 26, 52, 78, 104, 130],
        [6, 30, 56, 82, 108, 134],
        [6, 34, 60, 86, 112, 138],
        [6, 30, 58, 86, 114, 142],
        [6, 34, 62, 90, 118, 146],
        [6, 30, 54, 78, 102, 126, 150],
        [6, 24, 50, 76, 102, 128, 154],
        [6, 28, 54, 80, 106, 132, 158],
        [6, 32, 58, 84, 110, 136, 162],
        [6, 26, 54, 82, 110, 138, 166],
        [6, 30, 58, 86, 114, 142, 170]
      ];
      var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
      var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
      var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

      var _this = {};

      var getBCHDigit = function(data) {
        var digit = 0;
        while (data != 0) {
          digit += 1;
          data >>>= 1;
        }
        return digit;
      };

      _this.getBCHTypeInfo = function(data) {
        var d = data << 10;
        while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
          d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
        }
        return ( (data << 10) | d) ^ G15_MASK;
      };

      _this.getBCHTypeNumber = function(data) {
        var d = data << 12;
        while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
          d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
        }
        return (data << 12) | d;
      };

      _this.getPatternPosition = function(typeNumber) {
        return PATTERN_POSITION_TABLE[typeNumber - 1];
      };

      _this.getMaskFunction = function(maskPattern) {

        switch (maskPattern) {

        case QRMaskPattern.PATTERN000 :
          return function(i, j) { return (i + j) % 2 == 0; };
        case QRMaskPattern.PATTERN001 :
          return function(i, j) { return i % 2 == 0; };
        case QRMaskPattern.PATTERN010 :
          return function(i, j) { return j % 3 == 0; };
        case QRMaskPattern.PATTERN011 :
          return function(i, j) { return (i + j) % 3 == 0; };
        case QRMaskPattern.PATTERN100 :
          return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
        case QRMaskPattern.PATTERN101 :
          return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
        case QRMaskPattern.PATTERN110 :
          return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
        case QRMaskPattern.PATTERN111 :
          return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

        default :
          throw 'bad maskPattern:' + maskPattern;
        }
      };

      _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
        var a = qrPolynomial([1], 0);
        for (var i = 0; i < errorCorrectLength; i += 1) {
          a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
        }
        return a;
      };

      _this.getLengthInBits = function(mode, type) {

        if (1 <= type && type < 10) {

          // 1 - 9

          switch(mode) {
          case QRMode.MODE_NUMBER    : return 10;
          case QRMode.MODE_ALPHA_NUM : return 9;
          case QRMode.MODE_8BIT_BYTE : return 8;
          case QRMode.MODE_KANJI     : return 8;
          default :
            throw 'mode:' + mode;
          }

        } else if (type < 27) {

          // 10 - 26

          switch(mode) {
          case QRMode.MODE_NUMBER    : return 12;
          case QRMode.MODE_ALPHA_NUM : return 11;
          case QRMode.MODE_8BIT_BYTE : return 16;
          case QRMode.MODE_KANJI     : return 10;
          default :
            throw 'mode:' + mode;
          }

        } else if (type < 41) {

          // 27 - 40

          switch(mode) {
          case QRMode.MODE_NUMBER    : return 14;
          case QRMode.MODE_ALPHA_NUM : return 13;
          case QRMode.MODE_8BIT_BYTE : return 16;
          case QRMode.MODE_KANJI     : return 12;
          default :
            throw 'mode:' + mode;
          }

        } else {
          throw 'type:' + type;
        }
      };

      _this.getLostPoint = function(qrcode) {

        var moduleCount = qrcode.getModuleCount();

        var lostPoint = 0;

        // LEVEL1

        for (var row = 0; row < moduleCount; row += 1) {
          for (var col = 0; col < moduleCount; col += 1) {

            var sameCount = 0;
            var dark = qrcode.isDark(row, col);

            for (var r = -1; r <= 1; r += 1) {

              if (row + r < 0 || moduleCount <= row + r) {
                continue;
              }

              for (var c = -1; c <= 1; c += 1) {

                if (col + c < 0 || moduleCount <= col + c) {
                  continue;
                }

                if (r == 0 && c == 0) {
                  continue;
                }

                if (dark == qrcode.isDark(row + r, col + c) ) {
                  sameCount += 1;
                }
              }
            }

            if (sameCount > 5) {
              lostPoint += (3 + sameCount - 5);
            }
          }
        };

        // LEVEL2

        for (var row = 0; row < moduleCount - 1; row += 1) {
          for (var col = 0; col < moduleCount - 1; col += 1) {
            var count = 0;
            if (qrcode.isDark(row, col) ) count += 1;
            if (qrcode.isDark(row + 1, col) ) count += 1;
            if (qrcode.isDark(row, col + 1) ) count += 1;
            if (qrcode.isDark(row + 1, col + 1) ) count += 1;
            if (count == 0 || count == 4) {
              lostPoint += 3;
            }
          }
        }

        // LEVEL3

        for (var row = 0; row < moduleCount; row += 1) {
          for (var col = 0; col < moduleCount - 6; col += 1) {
            if (qrcode.isDark(row, col)
                && !qrcode.isDark(row, col + 1)
                &&  qrcode.isDark(row, col + 2)
                &&  qrcode.isDark(row, col + 3)
                &&  qrcode.isDark(row, col + 4)
                && !qrcode.isDark(row, col + 5)
                &&  qrcode.isDark(row, col + 6) ) {
              lostPoint += 40;
            }
          }
        }

        for (var col = 0; col < moduleCount; col += 1) {
          for (var row = 0; row < moduleCount - 6; row += 1) {
            if (qrcode.isDark(row, col)
                && !qrcode.isDark(row + 1, col)
                &&  qrcode.isDark(row + 2, col)
                &&  qrcode.isDark(row + 3, col)
                &&  qrcode.isDark(row + 4, col)
                && !qrcode.isDark(row + 5, col)
                &&  qrcode.isDark(row + 6, col) ) {
              lostPoint += 40;
            }
          }
        }

        // LEVEL4

        var darkCount = 0;

        for (var col = 0; col < moduleCount; col += 1) {
          for (var row = 0; row < moduleCount; row += 1) {
            if (qrcode.isDark(row, col) ) {
              darkCount += 1;
            }
          }
        }

        var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
        lostPoint += ratio * 10;

        return lostPoint;
      };

      return _this;
    }();

    //---------------------------------------------------------------------
    // QRMath
    //---------------------------------------------------------------------

    var QRMath = function() {

      var EXP_TABLE = new Array(256);
      var LOG_TABLE = new Array(256);

      // initialize tables
      for (var i = 0; i < 8; i += 1) {
        EXP_TABLE[i] = 1 << i;
      }
      for (var i = 8; i < 256; i += 1) {
        EXP_TABLE[i] = EXP_TABLE[i - 4]
          ^ EXP_TABLE[i - 5]
          ^ EXP_TABLE[i - 6]
          ^ EXP_TABLE[i - 8];
      }
      for (var i = 0; i < 255; i += 1) {
        LOG_TABLE[EXP_TABLE[i] ] = i;
      }

      var _this = {};

      _this.glog = function(n) {

        if (n < 1) {
          throw 'glog(' + n + ')';
        }

        return LOG_TABLE[n];
      };

      _this.gexp = function(n) {

        while (n < 0) {
          n += 255;
        }

        while (n >= 256) {
          n -= 255;
        }

        return EXP_TABLE[n];
      };

      return _this;
    }();

    //---------------------------------------------------------------------
    // qrPolynomial
    //---------------------------------------------------------------------

    function qrPolynomial(num, shift) {

      if (typeof num.length == 'undefined') {
        throw num.length + '/' + shift;
      }

      var _num = function() {
        var offset = 0;
        while (offset < num.length && num[offset] == 0) {
          offset += 1;
        }
        var _num = new Array(num.length - offset + shift);
        for (var i = 0; i < num.length - offset; i += 1) {
          _num[i] = num[i + offset];
        }
        return _num;
      }();

      var _this = {};

      _this.getAt = function(index) {
        return _num[index];
      };

      _this.getLength = function() {
        return _num.length;
      };

      _this.multiply = function(e) {

        var num = new Array(_this.getLength() + e.getLength() - 1);

        for (var i = 0; i < _this.getLength(); i += 1) {
          for (var j = 0; j < e.getLength(); j += 1) {
            num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
          }
        }

        return qrPolynomial(num, 0);
      };

      _this.mod = function(e) {

        if (_this.getLength() - e.getLength() < 0) {
          return _this;
        }

        var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

        var num = new Array(_this.getLength() );
        for (var i = 0; i < _this.getLength(); i += 1) {
          num[i] = _this.getAt(i);
        }

        for (var i = 0; i < e.getLength(); i += 1) {
          num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
        }

        // recursive call
        return qrPolynomial(num, 0).mod(e);
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // QRRSBlock
    //---------------------------------------------------------------------

    var QRRSBlock = function() {

      var RS_BLOCK_TABLE = [

        // L
        // M
        // Q
        // H

        // 1
        [1, 26, 19],
        [1, 26, 16],
        [1, 26, 13],
        [1, 26, 9],

        // 2
        [1, 44, 34],
        [1, 44, 28],
        [1, 44, 22],
        [1, 44, 16],

        // 3
        [1, 70, 55],
        [1, 70, 44],
        [2, 35, 17],
        [2, 35, 13],

        // 4
        [1, 100, 80],
        [2, 50, 32],
        [2, 50, 24],
        [4, 25, 9],

        // 5
        [1, 134, 108],
        [2, 67, 43],
        [2, 33, 15, 2, 34, 16],
        [2, 33, 11, 2, 34, 12],

        // 6
        [2, 86, 68],
        [4, 43, 27],
        [4, 43, 19],
        [4, 43, 15],

        // 7
        [2, 98, 78],
        [4, 49, 31],
        [2, 32, 14, 4, 33, 15],
        [4, 39, 13, 1, 40, 14],

        // 8
        [2, 121, 97],
        [2, 60, 38, 2, 61, 39],
        [4, 40, 18, 2, 41, 19],
        [4, 40, 14, 2, 41, 15],

        // 9
        [2, 146, 116],
        [3, 58, 36, 2, 59, 37],
        [4, 36, 16, 4, 37, 17],
        [4, 36, 12, 4, 37, 13],

        // 10
        [2, 86, 68, 2, 87, 69],
        [4, 69, 43, 1, 70, 44],
        [6, 43, 19, 2, 44, 20],
        [6, 43, 15, 2, 44, 16],

        // 11
        [4, 101, 81],
        [1, 80, 50, 4, 81, 51],
        [4, 50, 22, 4, 51, 23],
        [3, 36, 12, 8, 37, 13],

        // 12
        [2, 116, 92, 2, 117, 93],
        [6, 58, 36, 2, 59, 37],
        [4, 46, 20, 6, 47, 21],
        [7, 42, 14, 4, 43, 15],

        // 13
        [4, 133, 107],
        [8, 59, 37, 1, 60, 38],
        [8, 44, 20, 4, 45, 21],
        [12, 33, 11, 4, 34, 12],

        // 14
        [3, 145, 115, 1, 146, 116],
        [4, 64, 40, 5, 65, 41],
        [11, 36, 16, 5, 37, 17],
        [11, 36, 12, 5, 37, 13],

        // 15
        [5, 109, 87, 1, 110, 88],
        [5, 65, 41, 5, 66, 42],
        [5, 54, 24, 7, 55, 25],
        [11, 36, 12, 7, 37, 13],

        // 16
        [5, 122, 98, 1, 123, 99],
        [7, 73, 45, 3, 74, 46],
        [15, 43, 19, 2, 44, 20],
        [3, 45, 15, 13, 46, 16],

        // 17
        [1, 135, 107, 5, 136, 108],
        [10, 74, 46, 1, 75, 47],
        [1, 50, 22, 15, 51, 23],
        [2, 42, 14, 17, 43, 15],

        // 18
        [5, 150, 120, 1, 151, 121],
        [9, 69, 43, 4, 70, 44],
        [17, 50, 22, 1, 51, 23],
        [2, 42, 14, 19, 43, 15],

        // 19
        [3, 141, 113, 4, 142, 114],
        [3, 70, 44, 11, 71, 45],
        [17, 47, 21, 4, 48, 22],
        [9, 39, 13, 16, 40, 14],

        // 20
        [3, 135, 107, 5, 136, 108],
        [3, 67, 41, 13, 68, 42],
        [15, 54, 24, 5, 55, 25],
        [15, 43, 15, 10, 44, 16],

        // 21
        [4, 144, 116, 4, 145, 117],
        [17, 68, 42],
        [17, 50, 22, 6, 51, 23],
        [19, 46, 16, 6, 47, 17],

        // 22
        [2, 139, 111, 7, 140, 112],
        [17, 74, 46],
        [7, 54, 24, 16, 55, 25],
        [34, 37, 13],

        // 23
        [4, 151, 121, 5, 152, 122],
        [4, 75, 47, 14, 76, 48],
        [11, 54, 24, 14, 55, 25],
        [16, 45, 15, 14, 46, 16],

        // 24
        [6, 147, 117, 4, 148, 118],
        [6, 73, 45, 14, 74, 46],
        [11, 54, 24, 16, 55, 25],
        [30, 46, 16, 2, 47, 17],

        // 25
        [8, 132, 106, 4, 133, 107],
        [8, 75, 47, 13, 76, 48],
        [7, 54, 24, 22, 55, 25],
        [22, 45, 15, 13, 46, 16],

        // 26
        [10, 142, 114, 2, 143, 115],
        [19, 74, 46, 4, 75, 47],
        [28, 50, 22, 6, 51, 23],
        [33, 46, 16, 4, 47, 17],

        // 27
        [8, 152, 122, 4, 153, 123],
        [22, 73, 45, 3, 74, 46],
        [8, 53, 23, 26, 54, 24],
        [12, 45, 15, 28, 46, 16],

        // 28
        [3, 147, 117, 10, 148, 118],
        [3, 73, 45, 23, 74, 46],
        [4, 54, 24, 31, 55, 25],
        [11, 45, 15, 31, 46, 16],

        // 29
        [7, 146, 116, 7, 147, 117],
        [21, 73, 45, 7, 74, 46],
        [1, 53, 23, 37, 54, 24],
        [19, 45, 15, 26, 46, 16],

        // 30
        [5, 145, 115, 10, 146, 116],
        [19, 75, 47, 10, 76, 48],
        [15, 54, 24, 25, 55, 25],
        [23, 45, 15, 25, 46, 16],

        // 31
        [13, 145, 115, 3, 146, 116],
        [2, 74, 46, 29, 75, 47],
        [42, 54, 24, 1, 55, 25],
        [23, 45, 15, 28, 46, 16],

        // 32
        [17, 145, 115],
        [10, 74, 46, 23, 75, 47],
        [10, 54, 24, 35, 55, 25],
        [19, 45, 15, 35, 46, 16],

        // 33
        [17, 145, 115, 1, 146, 116],
        [14, 74, 46, 21, 75, 47],
        [29, 54, 24, 19, 55, 25],
        [11, 45, 15, 46, 46, 16],

        // 34
        [13, 145, 115, 6, 146, 116],
        [14, 74, 46, 23, 75, 47],
        [44, 54, 24, 7, 55, 25],
        [59, 46, 16, 1, 47, 17],

        // 35
        [12, 151, 121, 7, 152, 122],
        [12, 75, 47, 26, 76, 48],
        [39, 54, 24, 14, 55, 25],
        [22, 45, 15, 41, 46, 16],

        // 36
        [6, 151, 121, 14, 152, 122],
        [6, 75, 47, 34, 76, 48],
        [46, 54, 24, 10, 55, 25],
        [2, 45, 15, 64, 46, 16],

        // 37
        [17, 152, 122, 4, 153, 123],
        [29, 74, 46, 14, 75, 47],
        [49, 54, 24, 10, 55, 25],
        [24, 45, 15, 46, 46, 16],

        // 38
        [4, 152, 122, 18, 153, 123],
        [13, 74, 46, 32, 75, 47],
        [48, 54, 24, 14, 55, 25],
        [42, 45, 15, 32, 46, 16],

        // 39
        [20, 147, 117, 4, 148, 118],
        [40, 75, 47, 7, 76, 48],
        [43, 54, 24, 22, 55, 25],
        [10, 45, 15, 67, 46, 16],

        // 40
        [19, 148, 118, 6, 149, 119],
        [18, 75, 47, 31, 76, 48],
        [34, 54, 24, 34, 55, 25],
        [20, 45, 15, 61, 46, 16]
      ];

      var qrRSBlock = function(totalCount, dataCount) {
        var _this = {};
        _this.totalCount = totalCount;
        _this.dataCount = dataCount;
        return _this;
      };

      var _this = {};

      var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

        switch(errorCorrectionLevel) {
        case QRErrorCorrectionLevel.L :
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
        case QRErrorCorrectionLevel.M :
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
        case QRErrorCorrectionLevel.Q :
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
        case QRErrorCorrectionLevel.H :
          return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
        default :
          return undefined;
        }
      };

      _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

        var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

        if (typeof rsBlock == 'undefined') {
          throw 'bad rs block @ typeNumber:' + typeNumber +
              '/errorCorrectionLevel:' + errorCorrectionLevel;
        }

        var length = rsBlock.length / 3;

        var list = [];

        for (var i = 0; i < length; i += 1) {

          var count = rsBlock[i * 3 + 0];
          var totalCount = rsBlock[i * 3 + 1];
          var dataCount = rsBlock[i * 3 + 2];

          for (var j = 0; j < count; j += 1) {
            list.push(qrRSBlock(totalCount, dataCount) );
          }
        }

        return list;
      };

      return _this;
    }();

    //---------------------------------------------------------------------
    // qrBitBuffer
    //---------------------------------------------------------------------

    var qrBitBuffer = function() {

      var _buffer = [];
      var _length = 0;

      var _this = {};

      _this.getBuffer = function() {
        return _buffer;
      };

      _this.getAt = function(index) {
        var bufIndex = Math.floor(index / 8);
        return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
      };

      _this.put = function(num, length) {
        for (var i = 0; i < length; i += 1) {
          _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
        }
      };

      _this.getLengthInBits = function() {
        return _length;
      };

      _this.putBit = function(bit) {

        var bufIndex = Math.floor(_length / 8);
        if (_buffer.length <= bufIndex) {
          _buffer.push(0);
        }

        if (bit) {
          _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
        }

        _length += 1;
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // qrNumber
    //---------------------------------------------------------------------

    var qrNumber = function(data) {

      var _mode = QRMode.MODE_NUMBER;
      var _data = data;

      var _this = {};

      _this.getMode = function() {
        return _mode;
      };

      _this.getLength = function(buffer) {
        return _data.length;
      };

      _this.write = function(buffer) {

        var data = _data;

        var i = 0;

        while (i + 2 < data.length) {
          buffer.put(strToNum(data.substring(i, i + 3) ), 10);
          i += 3;
        }

        if (i < data.length) {
          if (data.length - i == 1) {
            buffer.put(strToNum(data.substring(i, i + 1) ), 4);
          } else if (data.length - i == 2) {
            buffer.put(strToNum(data.substring(i, i + 2) ), 7);
          }
        }
      };

      var strToNum = function(s) {
        var num = 0;
        for (var i = 0; i < s.length; i += 1) {
          num = num * 10 + chatToNum(s.charAt(i) );
        }
        return num;
      };

      var chatToNum = function(c) {
        if ('0' <= c && c <= '9') {
          return c.charCodeAt(0) - '0'.charCodeAt(0);
        }
        throw 'illegal char :' + c;
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // qrAlphaNum
    //---------------------------------------------------------------------

    var qrAlphaNum = function(data) {

      var _mode = QRMode.MODE_ALPHA_NUM;
      var _data = data;

      var _this = {};

      _this.getMode = function() {
        return _mode;
      };

      _this.getLength = function(buffer) {
        return _data.length;
      };

      _this.write = function(buffer) {

        var s = _data;

        var i = 0;

        while (i + 1 < s.length) {
          buffer.put(
            getCode(s.charAt(i) ) * 45 +
            getCode(s.charAt(i + 1) ), 11);
          i += 2;
        }

        if (i < s.length) {
          buffer.put(getCode(s.charAt(i) ), 6);
        }
      };

      var getCode = function(c) {

        if ('0' <= c && c <= '9') {
          return c.charCodeAt(0) - '0'.charCodeAt(0);
        } else if ('A' <= c && c <= 'Z') {
          return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
        } else {
          switch (c) {
          case ' ' : return 36;
          case '$' : return 37;
          case '%' : return 38;
          case '*' : return 39;
          case '+' : return 40;
          case '-' : return 41;
          case '.' : return 42;
          case '/' : return 43;
          case ':' : return 44;
          default :
            throw 'illegal char :' + c;
          }
        }
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // qr8BitByte
    //---------------------------------------------------------------------

    var qr8BitByte = function(data) {

      var _mode = QRMode.MODE_8BIT_BYTE;
      var _data = data;
      var _bytes = qrcode.stringToBytes(data);

      var _this = {};

      _this.getMode = function() {
        return _mode;
      };

      _this.getLength = function(buffer) {
        return _bytes.length;
      };

      _this.write = function(buffer) {
        for (var i = 0; i < _bytes.length; i += 1) {
          buffer.put(_bytes[i], 8);
        }
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // qrKanji
    //---------------------------------------------------------------------

    var qrKanji = function(data) {

      var _mode = QRMode.MODE_KANJI;
      var _data = data;

      var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
      if (!stringToBytes) {
        throw 'sjis not supported.';
      }
      !function(c, code) {
        // self test for sjis support.
        var test = stringToBytes(c);
        if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
          throw 'sjis not supported.';
        }
      }('\u53cb', 0x9746);

      var _bytes = stringToBytes(data);

      var _this = {};

      _this.getMode = function() {
        return _mode;
      };

      _this.getLength = function(buffer) {
        return ~~(_bytes.length / 2);
      };

      _this.write = function(buffer) {

        var data = _bytes;

        var i = 0;

        while (i + 1 < data.length) {

          var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

          if (0x8140 <= c && c <= 0x9FFC) {
            c -= 0x8140;
          } else if (0xE040 <= c && c <= 0xEBBF) {
            c -= 0xC140;
          } else {
            throw 'illegal char at ' + (i + 1) + '/' + c;
          }

          c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

          buffer.put(c, 13);

          i += 2;
        }

        if (i < data.length) {
          throw 'illegal char at ' + (i + 1);
        }
      };

      return _this;
    };

    //=====================================================================
    // GIF Support etc.
    //

    //---------------------------------------------------------------------
    // byteArrayOutputStream
    //---------------------------------------------------------------------

    var byteArrayOutputStream = function() {

      var _bytes = [];

      var _this = {};

      _this.writeByte = function(b) {
        _bytes.push(b & 0xff);
      };

      _this.writeShort = function(i) {
        _this.writeByte(i);
        _this.writeByte(i >>> 8);
      };

      _this.writeBytes = function(b, off, len) {
        off = off || 0;
        len = len || b.length;
        for (var i = 0; i < len; i += 1) {
          _this.writeByte(b[i + off]);
        }
      };

      _this.writeString = function(s) {
        for (var i = 0; i < s.length; i += 1) {
          _this.writeByte(s.charCodeAt(i) );
        }
      };

      _this.toByteArray = function() {
        return _bytes;
      };

      _this.toString = function() {
        var s = '';
        s += '[';
        for (var i = 0; i < _bytes.length; i += 1) {
          if (i > 0) {
            s += ',';
          }
          s += _bytes[i];
        }
        s += ']';
        return s;
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // base64EncodeOutputStream
    //---------------------------------------------------------------------

    var base64EncodeOutputStream = function() {

      var _buffer = 0;
      var _buflen = 0;
      var _length = 0;
      var _base64 = '';

      var _this = {};

      var writeEncoded = function(b) {
        _base64 += String.fromCharCode(encode(b & 0x3f) );
      };

      var encode = function(n) {
        if (n < 0) {
          // error.
        } else if (n < 26) {
          return 0x41 + n;
        } else if (n < 52) {
          return 0x61 + (n - 26);
        } else if (n < 62) {
          return 0x30 + (n - 52);
        } else if (n == 62) {
          return 0x2b;
        } else if (n == 63) {
          return 0x2f;
        }
        throw 'n:' + n;
      };

      _this.writeByte = function(n) {

        _buffer = (_buffer << 8) | (n & 0xff);
        _buflen += 8;
        _length += 1;

        while (_buflen >= 6) {
          writeEncoded(_buffer >>> (_buflen - 6) );
          _buflen -= 6;
        }
      };

      _this.flush = function() {

        if (_buflen > 0) {
          writeEncoded(_buffer << (6 - _buflen) );
          _buffer = 0;
          _buflen = 0;
        }

        if (_length % 3 != 0) {
          // padding
          var padlen = 3 - _length % 3;
          for (var i = 0; i < padlen; i += 1) {
            _base64 += '=';
          }
        }
      };

      _this.toString = function() {
        return _base64;
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // base64DecodeInputStream
    //---------------------------------------------------------------------

    var base64DecodeInputStream = function(str) {

      var _str = str;
      var _pos = 0;
      var _buffer = 0;
      var _buflen = 0;

      var _this = {};

      _this.read = function() {

        while (_buflen < 8) {

          if (_pos >= _str.length) {
            if (_buflen == 0) {
              return -1;
            }
            throw 'unexpected end of file./' + _buflen;
          }

          var c = _str.charAt(_pos);
          _pos += 1;

          if (c == '=') {
            _buflen = 0;
            return -1;
          } else if (c.match(/^\s$/) ) {
            // ignore if whitespace.
            continue;
          }

          _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
          _buflen += 6;
        }

        var n = (_buffer >>> (_buflen - 8) ) & 0xff;
        _buflen -= 8;
        return n;
      };

      var decode = function(c) {
        if (0x41 <= c && c <= 0x5a) {
          return c - 0x41;
        } else if (0x61 <= c && c <= 0x7a) {
          return c - 0x61 + 26;
        } else if (0x30 <= c && c <= 0x39) {
          return c - 0x30 + 52;
        } else if (c == 0x2b) {
          return 62;
        } else if (c == 0x2f) {
          return 63;
        } else {
          throw 'c:' + c;
        }
      };

      return _this;
    };

    //---------------------------------------------------------------------
    // gifImage (B/W)
    //---------------------------------------------------------------------

    var gifImage = function(width, height) {

      var _width = width;
      var _height = height;
      var _data = new Array(width * height);

      var _this = {};

      _this.setPixel = function(x, y, pixel) {
        _data[y * _width + x] = pixel;
      };

      _this.write = function(out) {

        //---------------------------------
        // GIF Signature

        out.writeString('GIF87a');

        //---------------------------------
        // Screen Descriptor

        out.writeShort(_width);
        out.writeShort(_height);

        out.writeByte(0x80); // 2bit
        out.writeByte(0);
        out.writeByte(0);

        //---------------------------------
        // Global Color Map

        // black
        out.writeByte(0x00);
        out.writeByte(0x00);
        out.writeByte(0x00);

        // white
        out.writeByte(0xff);
        out.writeByte(0xff);
        out.writeByte(0xff);

        //---------------------------------
        // Image Descriptor

        out.writeString(',');
        out.writeShort(0);
        out.writeShort(0);
        out.writeShort(_width);
        out.writeShort(_height);
        out.writeByte(0);

        //---------------------------------
        // Local Color Map

        //---------------------------------
        // Raster Data

        var lzwMinCodeSize = 2;
        var raster = getLZWRaster(lzwMinCodeSize);

        out.writeByte(lzwMinCodeSize);

        var offset = 0;

        while (raster.length - offset > 255) {
          out.writeByte(255);
          out.writeBytes(raster, offset, 255);
          offset += 255;
        }

        out.writeByte(raster.length - offset);
        out.writeBytes(raster, offset, raster.length - offset);
        out.writeByte(0x00);

        //---------------------------------
        // GIF Terminator
        out.writeString(';');
      };

      var bitOutputStream = function(out) {

        var _out = out;
        var _bitLength = 0;
        var _bitBuffer = 0;

        var _this = {};

        _this.write = function(data, length) {

          if ( (data >>> length) != 0) {
            throw 'length over';
          }

          while (_bitLength + length >= 8) {
            _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
            length -= (8 - _bitLength);
            data >>>= (8 - _bitLength);
            _bitBuffer = 0;
            _bitLength = 0;
          }

          _bitBuffer = (data << _bitLength) | _bitBuffer;
          _bitLength = _bitLength + length;
        };

        _this.flush = function() {
          if (_bitLength > 0) {
            _out.writeByte(_bitBuffer);
          }
        };

        return _this;
      };

      var getLZWRaster = function(lzwMinCodeSize) {

        var clearCode = 1 << lzwMinCodeSize;
        var endCode = (1 << lzwMinCodeSize) + 1;
        var bitLength = lzwMinCodeSize + 1;

        // Setup LZWTable
        var table = lzwTable();

        for (var i = 0; i < clearCode; i += 1) {
          table.add(String.fromCharCode(i) );
        }
        table.add(String.fromCharCode(clearCode) );
        table.add(String.fromCharCode(endCode) );

        var byteOut = byteArrayOutputStream();
        var bitOut = bitOutputStream(byteOut);

        // clear code
        bitOut.write(clearCode, bitLength);

        var dataIndex = 0;

        var s = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        while (dataIndex < _data.length) {

          var c = String.fromCharCode(_data[dataIndex]);
          dataIndex += 1;

          if (table.contains(s + c) ) {

            s = s + c;

          } else {

            bitOut.write(table.indexOf(s), bitLength);

            if (table.size() < 0xfff) {

              if (table.size() == (1 << bitLength) ) {
                bitLength += 1;
              }

              table.add(s + c);
            }

            s = c;
          }
        }

        bitOut.write(table.indexOf(s), bitLength);

        // end code
        bitOut.write(endCode, bitLength);

        bitOut.flush();

        return byteOut.toByteArray();
      };

      var lzwTable = function() {

        var _map = {};
        var _size = 0;

        var _this = {};

        _this.add = function(key) {
          if (_this.contains(key) ) {
            throw 'dup key:' + key;
          }
          _map[key] = _size;
          _size += 1;
        };

        _this.size = function() {
          return _size;
        };

        _this.indexOf = function(key) {
          return _map[key];
        };

        _this.contains = function(key) {
          return typeof _map[key] != 'undefined';
        };

        return _this;
      };

      return _this;
    };

    var createDataURL = function(width, height, getPixel) {
      var gif = gifImage(width, height);
      for (var y = 0; y < height; y += 1) {
        for (var x = 0; x < width; x += 1) {
          gif.setPixel(x, y, getPixel(x, y) );
        }
      }

      var b = byteArrayOutputStream();
      gif.write(b);

      var base64 = base64EncodeOutputStream();
      var bytes = b.toByteArray();
      for (var i = 0; i < bytes.length; i += 1) {
        base64.writeByte(bytes[i]);
      }
      base64.flush();

      return 'data:image/gif;base64,' + base64;
    };

    //---------------------------------------------------------------------
    // returns qrcode function.

    return qrcode;
  }();

  // multibyte support
  !function() {

    qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
      // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
      function toUTF8Array(str) {
        var utf8 = [];
        for (var i=0; i < str.length; i++) {
          var charcode = str.charCodeAt(i);
          if (charcode < 0x80) utf8.push(charcode);
          else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
          }
          else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
          }
          // surrogate pair
          else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
              | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18),
                0x80 | ((charcode>>12) & 0x3f),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
          }
        }
        return utf8;
      }
      return toUTF8Array(s);
    };

  }();

  (function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    }
  }(function () {
      return qrcode;
  }));

  
window.addEventListener('error',e=>{if(!document.body)return;let b=document.getElementById('jserr');if(!b){b=document.createElement('div');b.id='jserr';b.style.cssText='position:fixed;left:0;right:0;top:0;z-index:999;background:#fef2f2;color:#dc2626;padding:8px 14px;font:600 13px sans-serif';document.body.prepend(b)}b.textContent='Script error: '+e.message})

  const $=i=>document.getElementById(i),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ld=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return ld(d)};
  const fmt=s=>new Date(s+'T00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
  const now=()=>new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const dig=s=>String(s).replace(/\D/g,''),norm=s=>s.toLowerCase().replace(/[^a-zñ ]/g,' ').split(/\s+/).filter(Boolean).sort().join(' ');
  const opt=(l,s)=>l.map(x=>`<option ${x==s?'selected':''}>${x}</option>`).join('');
  const CONCERNS=['Bullying','Frequent absences','Peer conflict','Academic difficulty','Anxiety or sadness','Family concern','Behavior in class'];
  const BTYPES=['Physical','Verbal','Cyberbullying','Social exclusion'],LOCS=['Guidance Office','Conference Room','Classroom'],DOCCATS=['Intake interview','Anecdotal record','Consent form','Referral slip','Other'],INSRC=['Walk-in','Teacher referral','Parent request','Helpdesk chat'];
  const SLOTS=['08:30 AM','10:00 AM','01:30 PM','03:00 PM'],MOODS=['Calm','Anxious','Upset','Fearful'],WEEK=7*864e5;
  const ADV={Sampaguita:'Teacher Cruz',Narra:'Teacher Cruz',Mabini:'Teacher Santos',Rosal:'Teacher Santos',Rizal:'Teacher Lim',Luna:'Teacher Lim',Dahlia:'Teacher Dela Rosa',Molave:'Teacher Dela Rosa',Bonifacio:'Teacher Garcia'};
  const P=[['Mika Villanueva','3 – Sampaguita'],['Paolo Reyes','4 – Narra'],['Althea Mercado','2 – Mabini'],['Jerome Bautista','5 – Rizal'],['Sofia Navarro','1 – Rosal'],['Carlo Santos','6 – Luna'],['Bea Domingo','3 – Sampaguita'],['Lance Aquino','3 – Dahlia'],['Nina Ramos','4 – Narra'],['Marco Tolentino','4 – Molave'],['Ella Cruz','2 – Mabini'],['Rico Flores','5 – Rizal'],['Kyla Garcia','5 – Bonifacio'],['Daniel Pascual','6 – Luna'],['Hanna Lopez','1 – Rosal'],['Joshua Castro','1 – Sampaguita']].map((x,i)=>({id:i+1,lrn:'1070012300'+String(i+1).padStart(2,'0'),name:x[0],gr:'Grade '+x[1]}));
  const sec=p=>p.gr.split(' – ')[1],adv=p=>ADV[sec(p)]||'Unassigned',pp=id=>P.find(x=>x.id==id);
  const t0=Date.now();
  let S={user:null,pupil:false,tab:'today',sel:2,q:'',fg:'',open:0,chat:null,modal:null,mood:'Anxious',cat:'Bullying',seq:60,ocr:null,busy:false,kid:0,dq:'',auth:'in',authMsg:'',bk:{at:t0-18*36e5},
  staff:[{u:'guidance',pw:'demo',role:'guidance',name:'Ma’am De Ocampo (Guidance Lead)',em:'deocampo.guidance@sres.deped.gov.ph',isSuper:true,status:'Active',section:'',d:iso(-180)},{u:'teacher',pw:'demo',role:'teacher',name:'Teacher Cruz',em:'cruz.teacher@sres.deped.gov.ph',isSuper:false,status:'Active',section:'Sampaguita',d:iso(-120)}],
  cases:[{id:1,p:2,c:'Frequent absences',u:'Normal',st:'Ongoing',by:'Teacher Cruz',d:iso(-8),desc:'Absent 6 days this month.',notes:[{d:iso(-5),t:'Agreed on a weekly attendance check-in.'}]},
  {id:2,p:4,c:'Bullying',bt:'Physical',u:'Urgent',st:'New',by:'Teacher Lim',d:iso(-2),desc:'Pushing incident in the hallway near the Grade 5 room.',notes:[]},
  {id:3,p:1,c:'Academic difficulty',u:'Normal',st:'Closed',by:'Teacher Cruz',d:iso(-20),desc:'Struggling with English reading.',notes:[{d:iso(-14),t:'Joined the remedial reading group.'}]},
  {id:4,p:3,c:'Anxiety or sadness',u:'Normal',st:'Ongoing',by:'Teacher Santos',d:iso(-10),desc:'Often cries during the flag ceremony.',notes:[{d:iso(-9),t:'First support session done.'}]},
  {id:5,p:6,c:'Academic difficulty',u:'Normal',st:'Closed',by:'Teacher Lim',d:iso(-40),desc:'Needed math remediation.',notes:[]},{id:6,p:9,c:'Peer conflict',u:'Normal',st:'Closed',by:'Teacher Cruz',d:iso(-70),desc:'Argument over seating.',notes:[]},
  {id:7,p:12,c:'Bullying',bt:'Verbal',u:'Normal',st:'Closed',by:'Teacher Lim',d:iso(-72),desc:'Name-calling.',notes:[]},{id:8,p:5,c:'Family concern',u:'Normal',st:'Closed',by:'Teacher Santos',d:iso(-105),desc:'Parents separating.',notes:[]},{id:9,p:11,c:'Frequent absences',u:'Normal',st:'Closed',by:'Teacher Santos',d:iso(-135),desc:'Flooded home, missed class.',notes:[]}],
  appts:[{id:1,k:1,type:'Parent conference',d:iso(2),t:'10:00 AM',st:'Delivered',rq:null},{id:2,k:4,type:'Parent conference',d:iso(3),t:'01:30 PM',st:'Delivered',rq:null},{id:3,k:2,type:'Guidance consultation',d:iso(1),t:'08:30 AM',st:'Confirmed',rq:null},{id:4,k:2,type:'Guidance consultation',d:iso(0),t:'03:00 PM',st:'Confirmed',rq:null,loc:'Guidance Office'}],
  parents:[{id:1,name:'Mr. Reyes',ph:'09170000002',pw:'demo',em:'reyes.family@gmail.com',pref:'SMS and email',kids:[2]},{id:2,name:'Mrs. Villanueva',ph:'09170000001',pw:'demo',em:'villanueva.family@gmail.com',pref:'SMS and email',kids:[1]}],
  sms:[{p:2,w:'Today',ch:'SMS',m:'San Roque ES Guidance: Call slip for Paolo Reyes. Please attend a parent conference on '+fmt(iso(2))+' at 10:00 AM.',a:1},{p:2,w:'Today',ch:'Email',m:'Call slip for Paolo Reyes: parent conference on '+fmt(iso(2))+' at 10:00 AM. Confirm in the Parent Portal.',a:1}],
  obs:[{p:5,d:iso(-4),t:'Quiet during group work. Will observe for two weeks.'},{p:11,d:iso(-1),t:'Doing well after moving to a new section.'}],
  old:[{p:2,sy:'2024–2025',c:'Peer conflict',n:'Resolved after a parent conference.'},{p:6,sy:'2023–2024',c:'Academic difficulty',n:'Remediation completed. Case closed.'},{p:7,sy:'2024–2025',c:'Bullying',n:'Verbal teasing. Mediation done.'},{p:10,sy:'2023–2024',c:'Bullying',n:'Recess conflict. Resolved.'},{p:8,sy:'2023–2024',c:'Family concern',n:'Referred to the school nurse and parent.'},{p:13,sy:'2024–2025',c:'Frequent absences',n:'Attendance improved.'},{p:14,sy:'2025–2026',c:'Peer conflict',n:'Resolved after mediation.'},{p:15,sy:'2025–2026',c:'Bullying',n:'Name-calling. Parent conference held.'},{p:3,sy:'2025–2026',c:'Anxiety or sadness',n:'Support sessions completed.'}],
  docs:[{name:'Intake_Interview_Paolo_Reyes.pdf',d:iso(-2),lrn:'107001230002',text:'INTAKE INTERVIEW, SRES GUIDANCE OFFICE\nLRN 107001230002\nLearner: Paolo Reyes, Grade 4 – Narra\nConcern: Pushing incident during recess\nIntervention: Guidance Consultation.',cat:'Intake interview',pn:'Paolo Reyes'}],
  chats:[{id:1,code:'K-8392',pin:'1234',anon:true,alias:'Anonymous pupil',pid:0,cat:'Bullying',mood:'Anxious',at:t0-864e5,keep:false,msgs:[{s:'p',t:'Some classmates are spreading rumors in our group chat.',tm:'10:15 AM'}]},
  {id:2,code:'K-4410',pin:'4321',anon:false,alias:'Paolo Reyes',pid:2,cat:'Peer conflict',mood:'Upset',at:t0-3*864e5,keep:false,msgs:[{s:'p',t:'Older pupils pushed me during recess yesterday.',tm:'Yesterday'},{s:'g',t:'Thank you for telling us, Paolo. A call slip went to your parent.',tm:'Yesterday'}]}]};
  const KEY='kalinga-v3';
  const snap=()=>JSON.stringify({P,cases:S.cases,appts:S.appts,sms:S.sms,chats:S.chats,docs:S.docs,obs:S.obs,old:S.old,parents:S.parents,staff:S.staff,adv:ADV,seq:S.seq,bk:S.bk});
  function save(){try{localStorage.setItem(KEY,snap())}catch(e){}}
  function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('kalinga-v2'));if(j){P.length=0;P.push(...j.P);delete j.P;Object.assign(S,j);if(j.adv)Object.assign(ADV,j.adv)}}catch(e){}if(!S.staff||!S.staff.length)S.staff=[{u:'guidance',pw:'demo',role:'guidance',name:'Ma’am De Ocampo (Guidance Lead)',em:'deocampo.guidance@sres.deped.gov.ph',isSuper:true,status:'Active',section:'',d:iso(-180)},{u:'teacher',pw:'demo',role:'teacher',name:'Teacher Cruz',em:'cruz.teacher@sres.deped.gov.ph',isSuper:false,status:'Active',section:'Sampaguita',d:iso(-120)}];S.staff.forEach(s=>{if(!s.status)s.status='Active';if(s.u==='guidance'){s.isSuper=true;if(!s.name.includes('Lead'))s.name='Ma’am De Ocampo (Guidance Lead)'}});}
  function reset(){try{localStorage.removeItem(KEY)}catch(e){}location.reload()}
  load();
  if(location.hash=='#helpdesk')S.pupil=true;
  const cs=id=>S.cases.find(c=>c.id==id),parentOf=id=>S.parents.find(x=>x.kids.includes(id)),exp=c=>c.at+WEEK;
  const live=c=>exp(c)>Date.now();
  function purge(){}/* expired chats lose pupil access but stay on the counselor dashboard */
  function toast(m,ms){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),ms||2800)}
  const go=t=>{S.tab=t;render()};
  const APT=['Delivered','Confirmed','Reschedule requested'],ref=a=>'R-'+a.id;
  const apP=a=>a.p||cs(a.k).p,taken=(d,t,ig)=>S.appts.some(a=>a.id!=ig&&a.d==d&&a.t==t&&APT.includes(a.st)),wkend=d=>[0,6].includes(new Date(d+'T00:00').getDay());
  const slotOpts=(d,sel)=>SLOTS.map(t=>`<option ${taken(d,t)?'disabled':''} ${t==sel?'selected':''} value="${t}">${t}${taken(d,t)?' (booked)':''}</option>`).join('');
  const okDate=(d,ig,t)=>!d?'Pick a date.':d<iso(0)?'Pick today or a later date.':wkend(d)?'The Guidance Office is closed on weekends. Pick a weekday.':t&&taken(d,t,ig)?'That time is already booked. Pick another slot.':'';
  const nwd=n=>{let i=n;while(wkend(iso(i)))i++;return iso(i)};
  const syOf=d=>{const y=+d.slice(0,4),m=+d.slice(5,7);return m>=6?y+'–'+(y+1):(y-1)+'–'+y};
  const syRows=()=>{const m={};S.cases.forEach(c=>{const k=syOf(c.d);m[k]=(m[k]||0)+1});S.old.forEach(o=>{m[o.sy]=(m[o.sy]||0)+1});return Object.keys(m).sort().map(k=>['SY '+k,m[k]])};
  const btRows=cl=>{const b=cl.filter(c=>c.c=='Bullying'),r=BTYPES.map(k=>[k,b.filter(c=>c.bt==k).length]),n=b.filter(c=>!BTYPES.includes(c.bt)).length;if(n)r.push(['Not specified',n]);return r};
  const AG=[...APT,'Attended','No-show'],parentLine=a=>{const pa=parentOf(apP(a));return pa?'Parent: '+esc(pa.name)+', '+esc(pa.ph):'No parent account yet (hand-deliver the slip)'};
  const chDesc=pa=>pa?pa.pref.toLowerCase():'hand delivery';
  function notify(pid,msg,aid){const pa=parentOf(pid),ch=pa?(pa.pref=='SMS only'?['SMS']:pa.pref=='Email only'?['Email']:['SMS','Email']):[];
  if(!ch.length)S.sms.unshift({p:pid,w:'Just now',ch:'None',m:msg+' (No parent account yet. The adviser will hand-deliver this slip.)',a:aid});
  ch.forEach(c=>S.sms.unshift({p:pid,w:'Just now',ch:c,m:msg,a:aid}));return pa}
  const unread=()=>S.chats.filter(c=>live(c)&&c.msgs.length&&c.msgs.at(-1).s==='p').length,pend=()=>S.appts.filter(a=>['Reschedule requested','Requested'].includes(a.st)).length;

  /* ---- auth ---- */
  /* ---- auth & personnel account control ---- */
  const DEFAULT_STAFF=[
    {u:'guidance',pw:'demo',role:'guidance',name:'Ma’am De Ocampo (Guidance Lead)',em:'deocampo.guidance@sres.deped.gov.ph',isSuper:true,status:'Active',section:'',d:iso(-180)},
    {u:'teacher',pw:'demo',role:'teacher',name:'Teacher Cruz',em:'cruz.teacher@sres.deped.gov.ph',isSuper:false,status:'Active',section:'Sampaguita',d:iso(-120)}
  ];
  const pendingStaff=()=>(S.staff||[]).filter(s=>s.status==='Pending');
  const activeStaff=()=>(S.staff||[]).filter(s=>s.status==='Active');
  function apprStaff(u,ok){
    const st=(S.staff||[]).find(s=>s.u.toLowerCase()===u.toLowerCase());
    if(!st)return;
    if(ok){
      st.status='Active';
      if(st.role==='teacher'&&st.section)ADV[st.section]=st.name;
      toast('Approved access for '+st.name+' ('+(st.role==='guidance'?'Guidance Personnel':'Teacher')+').');
    }else{
      st.status='Declined';
      toast('Declined registration for '+st.name+'.');
    }
    save();render();
  }
  function toggleStaffStatus(u){
    const st=(S.staff||[]).find(s=>s.u.toLowerCase()===u.toLowerCase());
    if(!st||st.isSuper)return toast('Cannot modify master Super Admin account.');
    st.status=st.status==='Active'?'Suspended':'Active';
    toast(st.name+' account '+(st.status==='Active'?'activated':'suspended')+'.');
    save();render();
  }
  function delStaff(u){
    const st=(S.staff||[]).find(s=>s.u.toLowerCase()===u.toLowerCase());
    if(!st)return;
    if(st.isSuper)return toast('Cannot delete master Super Admin account.');
    if(!confirm('Permanently remove personnel account for '+st.name+'?'))return;
    S.staff=S.staff.filter(s=>s.u.toLowerCase()!==u.toLowerCase());
    toast('Account deleted.');save();render();
  }
  function demo(k){$('lu').value={g:'guidance',t:'teacher',p:'09170000002'}[k];$('lp').value='demo'}
  function login(e){e.preventDefault();try{loginGo()}catch(x){const m=$('lerr');if(m)m.textContent='Something went wrong: '+x.message}}
  function loginGo(){const u=$('lu').value.trim().toLowerCase(),pw=$('lp').value;
  const s=(S.staff||DEFAULT_STAFF).find(x=>(x.u.toLowerCase()==u||(x.em&&x.em.toLowerCase()==u))&&x.pw==pw);
  if(s){
    if(s.status==='Pending')return $('lerr').innerHTML='<b style="color:var(--danger)">Access Pending Approval:</b> Your registration is awaiting review & authorization by the Guidance Lead (Super Admin). Please contact the Guidance Office.';
    if(s.status==='Declined')return $('lerr').innerHTML='<b style="color:var(--danger)">Access Declined:</b> This account request was declined by the Guidance Office.';
    if(s.status==='Suspended')return $('lerr').innerHTML='<b style="color:var(--danger)">Account Suspended:</b> This personnel account is currently deactivated.';
    S.user={role:s.role,name:s.name,u:s.u,isSuper:!!s.isSuper};
    S.tab=s.role=='guidance'?'today':'refer';
    return render();
  }
  const pa=S.parents.find(x=>(dig(x.ph)==dig(u)&&dig(u)||x.em.toLowerCase()==u)&&x.pw==pw);if(pa){S.user={role:'parent',name:pa.name,pid:pa.id};S.kid=pa.kids[0];S.tab='portal';return render()}
  $('lerr').textContent='That username and password do not match. Use the demo buttons below to try a role.'}
  function signup(e){e.preventDefault();const g=i=>$(i).value.trim(),ph=dig(g('sm')),em=g('se').toLowerCase(),l=dig(g('sl')),n=g('sk'),E=m=>$('serr').textContent=m;
  if(!g('sn'))return E('Enter your full name.');if(!/^09\d{9}$/.test(ph))return E('Mobile number must be 11 digits starting with 09.');if(!/^\S+@\S+\.\S+$/.test(em))return E('Enter a valid email address.');if(g('sp').length<6)return E('Password needs at least 6 characters.');if(!$('sc').checked)return E('Please accept the data privacy notice.');
  if(S.parents.some(x=>x.ph==ph||x.em==em))return E('That mobile number or email is already registered.');
  const p=P.find(x=>x.lrn==l);if(!p||norm(p.name)!=norm(n))return E('We could not match that name and LRN. Check the spelling or ask the Guidance Office.');if(parentOf(p.id))return E(p.name+' is already linked to another parent account.');
  const pa={id:++S.seq,name:g('sn'),ph,pw:g('sp'),em,pref:g('sf'),kids:[p.id]};S.parents.push(pa);S.user={role:'parent',name:pa.name,pid:pa.id};S.kid=p.id;S.tab='portal';toast('Account created and linked to '+p.name+'.');render()}
  function vAuth(){const up=S.auth=='up';return `
  <div class="cols b"><div class="blk"><div class="pills" style="margin:0 0 14px"><button aria-pressed="${!up}" onclick="S.auth='in';render()">Log in</button><button aria-pressed="${up}" onclick="S.auth='up';render()">Parent sign-up</button></div>
  ${up?`<form onsubmit="signup(event)"><label>Full name<input id="sn" autocomplete="name"></label><div class="row2"><label>Mobile (09XX)<input id="sm" inputmode="tel"></label><label>Email<input id="se" type="email"></label></div>
  <div class="row2"><label>Password<input id="sp" type="password"></label><label>Send notices by<select id="sf">${opt(['SMS and email','SMS only','Email only'])}</select></label></div>
  <div class="row2"><label>Child’s full name<input id="sk"></label><label>Child’s LRN<input id="sl" inputmode="numeric" maxlength="12" placeholder="107001230001"></label></div>
  <label style="display:flex;gap:8px;align-items:flex-start;font-weight:500"><input id="sc" type="checkbox" style="display:inline-block;width:auto;min-height:0;margin-top:3px">I agree that the school uses my contact details only for guidance notices (RA 10173).</label>
  <p id="serr" class="err" role="alert"></p><button class="btn y">Create account</button></form>`
  :`${S.authMsg?`<div class="note" style="border-left-color:var(--success);background:var(--success-light);margin-bottom:14px"><b>Notice:</b> ${esc(S.authMsg)}</div>`:''}<form onsubmit="login(event)"><label>Username, mobile, or email<input id="lu" autocomplete="username"></label><label>Password<input id="lp" type="password" autocomplete="current-password"></label><p id="lerr" class="err" role="alert"></p><button class="btn y">Sign in</button>
  <p class="mute" style="margin-top:14px">Try a demo: <button type="button" class="lk" onclick="demo('g')">Guidance (Super Admin)</button>, <button type="button" class="lk" onclick="demo('t')">Class adviser</button>, <button type="button" class="lk" onclick="demo('p')">Parent</button> (password: demo)</p></form>`}</div>
  <div class="blk y"><h3>Are you a pupil?</h3><p class="mute">No login, no name needed. Scan the QR poster outside the Guidance Room or start here.</p><button class="btn" onclick="S.pupil=true;S.chat=null;render()">chat to counselor</button>
  <p class="mute" style="margin-top:26px;max-width:46ch">Handled under the DepEd Child Protection Policy (DO 40, s. 2012) and the Data Privacy Act (RA 10173).</p></div></div>`}
  /* ---- guidance: today ---- */
  function trend(){const ms=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);ms.push(ld(d).slice(0,7))}
  const v=ms.map(m=>S.cases.filter(c=>c.d.slice(0,7)==m).length),mx=Math.max(1,...v);
  return `<svg viewBox="0 0 300 130" role="img" aria-label="Cases per month: ${v.join(', ')}" style="width:100%;max-width:420px">${v.map((n,i)=>`<rect x="${i*50+10}" y="${100-n/mx*80}" width="30" height="${n/mx*80}" fill="var(--sea2)"/><text x="${i*50+25}" y="${95-n/mx*80}" text-anchor="middle" font-size="12" fill="var(--ink)">${n}</text><text x="${i*50+25}" y="118" text-anchor="middle" font-size="11" fill="var(--mute)">${new Date(ms[i]+'-15T00:00').toLocaleDateString('en-PH',{month:'short'})}</text>`).join('')}</svg>`}
  const bars=(rows,cls='')=>{const mx=Math.max(1,...rows.map(r=>r[1]));return rows.map(([k,v])=>`<div class="bar"><span>${k}</span><i class="${cls}" style="width:${v/mx*100}%"></i><b>${v}</b></div>`).join('')};
  function vToday(){const op=S.cases.filter(c=>c.st!='Closed'),u=op.filter(c=>c.u=='Urgent').length,tot=S.cases.length||1,nw=S.cases.filter(c=>c.st=='New'),
  pr=S.appts.filter(a=>a.st=='Requested'),rq=S.appts.filter(a=>a.st=='Reschedule requested'),ch=S.chats.filter(c=>live(c)&&c.msgs.length&&c.msgs.at(-1).s==='p'),A=S.appts.length||1,cf=S.appts.filter(a=>a.st=='Confirmed').length,rr=rq.length,pst=pendingStaff();
  return `<div class="top"><div><h2>Good day, Ma’am De Ocampo <span class="tag good" style="font-size:12px;vertical-align:middle;margin-left:6px;background:var(--primary);color:#fff">Guidance Super Admin</span></h2><p class="lede">Here is what needs your authorization and reply before the next bell.</p></div><button class="btn s o" onclick="window.print()">Print report</button></div>
  ${pst.length?`<div class="note" style="border-left-color:var(--danger);background:var(--danger-light);margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><b style="color:var(--danger)">Super Admin Account Alert:</b> <b>${pst.length}</b> new school personnel requested access to the system.</div><button class="btn s" onclick="go('staff')">Review Personnel (${pst.length})</button></div>`:''}
  <div class="note" style="border-left-color:var(--primary);background:var(--primary-light);margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><div><b style="color:var(--primary)">DepEd Guidance Forms & Document Generator:</b> 5 official forms (Anecdotal Record, Annexes A–D) ready for digital generation, blank print, or Word export.</div><button class="btn s" onclick="go('forms')">Open Download Forms (5)</button></div>
  <div class="cols a"><div class="blk"><h3>Caseload level</h3><div class="gauge"><div class="tank" role="img" aria-label="${op.length} of ${tot} cases open, ${u} urgent"><div class="w" style="height:${op.length/tot*100}%"></div><div class="u" style="height:${u/tot*100}%"></div></div>
  <div class="legend"><p><b>${op.length}</b>open of ${tot}</p><p><b style="color:var(--brick)">${u}</b>urgent</p><p><b>${S.chats.filter(live).length}</b>live chats</p></div></div></div>
  <div class="blk r"><h3>Needs you now</h3>
  ${pst.map(st=>`<div class="item"><div><b>${esc(st.name)}</b> wants to sign in as <span class="tag ${st.role=='guidance'?'bad':'warn'}">${st.role=='guidance'?'Guidance Personnel':'Teacher'}</span>${st.section?' ('+esc(st.section)+')':''}<br><span class="mute">Username: <b>${esc(st.u)}</b> · Email: ${esc(st.em||'None')} · Requested ${fmt(st.d||iso(0))}</span></div><div class="row2"><button class="btn s" onclick="apprStaff('${st.u}',true)">Approve</button><button class="btn s o" onclick="apprStaff('${st.u}',false)">Decline</button></div></div>`).join('')}
  ${nw.map(c=>`<div class="item"><div><b>${pp(c.p).name}</b>, ${c.c} ${c.u=='Urgent'?'<span class="tag bad">Urgent</span>':''}<br><span class="mute">Referred by ${c.by} on ${fmt(c.d)}</span></div><button class="btn s" onclick="S.sel=${c.id};go('cases')">Open case</button></div>`).join('')}
  ${pr.map(a=>{const p=pp(apP(a));return `<div class="item"><div><b>${p.name}</b>’s parent requests a ${a.type.toLowerCase()}<br><span class="mute">${fmt(a.d)} at ${a.t}${taken(a.d,a.t,a.id)?' (that slot is booked)':''}. “${esc(a.why||'')}”</span></div><div class="row2"><button class="btn s" onclick="apprReq(${a.id})">Approve</button><button class="btn s o" onclick="S.modal='dc${a.id}';render()">Decline</button></div></div>`}).join('')}
  ${rq.map(a=>{const p=pp(apP(a));return `<div class="item"><div><b>${p.name}</b>’s parent asks to move the conference<br><span class="mute">${fmt(a.d)} ${a.t} to ${fmt(a.rq.d)} ${a.rq.t}. “${esc(a.rq.why)}”</span></div><div class="row2"><button class="btn s" onclick="resched(${a.id},1)">Approve</button><button class="btn s o" onclick="resched(${a.id},0)">Keep original</button></div></div>`}).join('')}
  ${ch.map(c=>`<div class="item"><div><b>${esc(c.alias)}</b> is waiting for a reply<br><span class="mute">${esc(c.msgs.at(-1).t.slice(0,80))}</span></div><button class="btn s" onclick="S.chat=${c.id};go('desk')">Reply</button></div>`).join('')}
  ${nw.length+rq.length+ch.length+pr.length?'':'<p class="empty">Nothing waiting. Every referral, chat, and request is handled.</p>'}</div></div>
  <div class="blk y" style="margin-top:36px"><div class="item" style="padding-top:0"><h3 style="margin:0">Who is scheduled today</h3><button class="btn s o" onclick="S.day=iso(0);go('sched')">Open full agenda</button></div>${whoToday()}</div>
  <div class="cols b" style="margin-top:36px"><div class="blk y"><h3>Cases opened per month</h3>${trend()}</div>
  <div class="blk y"><h3>Conference RSVPs</h3>${bars([['Attended',S.appts.filter(a=>a.st=='Attended').length],['Confirmed',cf],['Waiting for parent',S.appts.filter(a=>a.st=='Delivered').length],['Asked to reschedule',rr],['No-show',S.appts.filter(a=>a.st=='No-show').length]],'g')}</div></div>
  <div class="blk" style="margin-top:36px"><h3>Concerns this term</h3>${bars(CONCERNS.map(k=>[k,S.cases.filter(c=>c.c==k).length]).sort((a,b)=>b[1]-a[1]))}</div>
  <div class="cols b" style="margin-top:36px"><div class="blk"><h3>Types of bullying</h3>${bars(btRows(S.cases))}</div><div class="blk"><h3>Incidents by school year</h3>${bars(syRows())}<p class="mute">Includes archived records from earlier school years.</p></div></div>`}
  const whoToday=()=>SLOTS.map(t=>[t,S.appts.find(a=>a.d==iso(0)&&a.t==t&&AG.includes(a.st))]).filter(x=>x[1]).map(([t,a])=>`<div class="item"><div><b>${t}</b>, ${esc(pp(apP(a)).name)}<br><span class="mute">${a.type}, ${esc(a.loc||'Guidance Office')}. ${parentLine(a)}</span></div>${apTag(a)}</div>`).join('')||'<p class="empty">No conferences scheduled today.</p>'
  /* ---- cases ---- */
  function vCases(){const c=cs(S.sel)||S.cases[0],p=pp(c.p),pa=parentOf(p.id),ap=S.appts.filter(a=>a.k==c.id);
  return `<div class="top"><div><h2>Intake and cases</h2><p class="lede">Notes here are visible to guidance only. Advisers and parents never see them.</p></div><button class="btn y" style="margin:0 0 20px" onclick="S.modal='intake';render()">New intake interview</button></div><div class="cols a"><div class="blk">
  ${S.cases.map(x=>`<div class="item ${x.id==c.id?'sel':''}"><div><b>${pp(x.p).name}</b><br><span class="mute">${x.c}</span></div><span class="tag ${x.st}">${x.st}</span><button class="btn s o" onclick="S.sel=${x.id};render()" aria-label="Open ${esc(pp(x.p).name)}">Open</button></div>`).join('')}</div>
  <div class="blk y"><h2 style="font-size:26px">${p.name}</h2><p class="mute">${p.gr}, LRN ${p.lrn}. Adviser ${adv(p)}. Parent: ${pa?pa.name+', '+pa.ph:'no account yet'}.</p>
  <p><b>${c.c}</b> ${c.u=='Urgent'?'<span class="tag bad">Urgent</span>':''}<br>${esc(c.desc)}<br><span class="mute">Referred by ${esc(c.by)} on ${fmt(c.d)}</span></p>
  ${c.c=='Bullying'?`<label for="bt">Type of bullying</label><select id="bt" onchange="cs(${c.id}).bt=this.value;save();toast('Saved.');render()"><option value="">Not specified</option>${BTYPES.map(b=>`<option ${c.bt==b?'selected':''}>${b}</option>`).join('')}</select>`:''}
  ${c.intake?`<div class="note"><b>Intake interview</b> <span class="mute">via ${esc(c.intake.src)}</span><br><span class="mute">Home and background:</span> ${esc(c.intake.bg||'None noted')}<br><span class="mute">Plan:</span> ${esc(c.intake.plan||'None yet')}<br><span class="mute">Parent informed:</span> ${c.intake.informed}</div>`:''}
  <label for="st">Status</label><select id="st" onchange="cs(${c.id}).st=this.value;save();toast('Status set to '+this.value);render()">${opt(['New','Ongoing','Closed'],c.st)}</select>
  <h3 style="margin-top:22px">Confidential anecdotal notes</h3>${c.notes.map(n=>`<div class="note"><span class="mute">${fmt(n.d)}</span><br>${esc(n.t)}</div>`).join('')||'<p class="empty">No notes yet. Write what you observed in this session.</p>'}
  <textarea id="nn" rows="2" aria-label="New note"></textarea><button class="btn s o" style="margin-top:8px" onclick="addNote(${c.id})">Save note</button>
  <h3 style="margin-top:26px">Scanned forms in the vault</h3>${S.docs.filter(d=>d.lrn==p.lrn).map(d=>`<div class="note"><b>${esc(d.name)}</b> <span class="tag good">${esc(d.cat||'Intake interview')}</span> <span class="mute">${fmt(d.d)}</span></div>`).join('')||'<p class="empty">No scanned forms for this pupil yet.</p>'}
  <h3 style="margin-top:26px">Send a call slip</h3><div class="row2"><label>Type<select id="at">${opt(['Parent conference','Parent-teacher-counselor conference','Guidance consultation'])}</select></label><label>Language<select id="al"><option value="en">English</option><option value="fil">Filipino</option></select></label></div>
  <div class="row2"><label>Date<input id="ad" type="date" value="${iso(2)}" min="${iso(0)}"></label><label>Time<select id="atm">${opt(SLOTS)}</select></label></div>
  <label>Venue<select id="aloc">${opt(LOCS)}</select></label><button class="btn y" onclick="slip(${c.id})">Send call slip</button><p class="mute">Goes by ${pa?pa.pref.toLowerCase():'hand delivery (no parent account)'}.</p>
  ${ap.length?`<p class="mute">Booked: ${ap.map(a=>`${a.type}, ${fmt(a.d)} ${a.t} (${a.st.toLowerCase()})`).join('; ')}</p>`:''}</div></div>`}
  function addNote(id){const v=$('nn').value.trim();if(!v)return toast('Write a note first.');const c=cs(id);c.notes.push({d:iso(0),t:v});if(c.st=='New')c.st='Ongoing';save();toast('Note saved.');render()}
  function schedFor(pid,k,type,d,t,fil,loc){const p=pp(pid),e=okDate(d,0,t),L=loc||'Guidance Office';if(e){toast(e);return false}
  const c=k?cs(k):S.cases.find(x=>x.p==pid&&x.st!='Closed'),aid=++S.seq;S.appts.push({id:aid,k:c?c.id:null,p:pid,type,d,t,loc:L,st:'Delivered',rq:null});if(c&&c.st=='New')c.st='Ongoing';
  const pa=notify(pid,fil?`San Roque ES Guidance: Pinapatawag po ang magulang ni ${p.name} para sa ${type.toLowerCase()} sa ${fmt(d)}, ${t} (${L}). Kumpirmahin sa Parent Portal.`:`San Roque ES Guidance: Call slip for ${p.name}. Please attend a ${type.toLowerCase()} on ${fmt(d)} at ${t}, ${L}. Confirm in the Parent Portal.`,aid);
  save();toast(pa?'Scheduled. '+pa.name+' was notified by '+chDesc(pa)+'.':'Scheduled. No parent account yet, so hand-deliver the slip.');return true}
  function slip(id){const c=cs(id);if(schedFor(c.p,id,$('at').value,$('ad').value,$('atm').value,$('al').value=='fil',$('aloc').value))render()}
  function schedForm(e){e.preventDefault();if(schedFor(+$('sp1').value,0,$('st1').value,$('sd1').value,$('stm').value,$('sl1').value=='fil',$('sloc').value))render()}
  function resched(id,yes){const a=S.appts.find(x=>x.id==id),p=pp(apP(a));
  if(yes){if(taken(a.rq.d,a.rq.t,a.id)||wkend(a.rq.d))return toast('That time is no longer free. Keep the original time or ask the parent to pick another.');a.d=a.rq.d;a.t=a.rq.t;a.st='Confirmed';notify(p.id,`San Roque ES Guidance: Your request was approved. The conference for ${p.name} is now ${fmt(a.d)} at ${a.t}.`)}
  else{a.st='Delivered';notify(p.id,`San Roque ES Guidance: The original time for ${p.name} stays: ${fmt(a.d)}, ${a.t}. Please call the Guidance Office if you cannot attend.`)}
  a.rq=null;save();toast(yes?'New time approved. Parent notified.':'Original time kept. Parent notified.');render()}
  function apprReq(id){const a=S.appts.find(x=>x.id==id),p=pp(apP(a));if(taken(a.d,a.t,a.id)||wkend(a.d))return toast('That slot is taken now. Decline and suggest another time.');
  a.st='Confirmed';notify(p.id,`San Roque ES Guidance: Request ${ref(a)} is approved. ${a.type} for ${p.name} on ${fmt(a.d)} at ${a.t}.`);save();toast('Approved. Parent notified.');render()}
  function doDecl(e,id){e.preventDefault();const a=S.appts.find(x=>x.id==id),p=pp(apP(a)),r=$('dr').value.trim();if(!r)return toast('Give the parent a reason or a better time.');
  a.st='Declined';a.why2=r;notify(p.id,`San Roque ES Guidance: Request ${ref(a)} for ${p.name} could not be scheduled. ${r} You can send a new request in the Parent Portal.`);S.modal=null;save();toast('Declined. Parent notified.');render()}
  const gw=x=>x.ch=='SMS'?' <span class="mute">via Twilio</span>':x.ch=='Email'?' <span class="mute">via SMTP2GO</span>':'';
  function remind(id){const a=S.appts.find(x=>x.id==id),p=pp(apP(a));notify(p.id,`San Roque ES Guidance: Reminder. ${a.type} for ${p.name} on ${fmt(a.d)} at ${a.t}, ${a.loc||'Guidance Office'}. Please confirm in the Parent Portal.`,a.id);save();toast('Reminder sent.');render()}
  function mark(id,s){S.appts.find(x=>x.id==id).st=s;save();toast('Marked '+s.toLowerCase()+'.');render()}
  const apTag=a=>`<span class="tag ${a.st=='Confirmed'||a.st=='Attended'?'good':a.st=='Declined'||a.st=='No-show'?'bad':a.st=='Delivered'?'':'warn'}">${a.st=='Requested'?'Waiting for guidance':a.st}</span>`;
  const sent=x=>x.ch=='None'?'':'<span class="tag good">Sent</span>';
  function dayView(){const d=S.day||iso(0);return SLOTS.map(t=>{const a=S.appts.find(x=>x.d==d&&x.t==t&&AG.includes(x.st));return `<div class="item"><b>${t}</b>${a?`<div><b>${esc(pp(apP(a)).name)}</b><br><span class="mute">${a.type}, ${esc(a.loc||'Guidance Office')}<br>${parentLine(a)}</span></div>${apTag(a)}`:'<span class="tag good">Open</span>'}</div>`}).join('')}
  function vSched(){const L=[...S.appts].sort((a,b)=>a.d.localeCompare(b.d)),d0=nwd(1);
  return `<h2>Schedule</h2><p class="lede">Book parents, approve their requests, and see which times are open. Parents get a message every time.</p>
  <div class="cols b"><div class="blk y"><h3>Schedule a parent</h3><form onsubmit="schedForm(event)"><label style="margin-top:0">Pupil<select id="sp1">${P.map(p=>`<option value="${p.id}">${p.name}, ${p.gr}${parentOf(p.id)?'':' (no parent account)'}</option>`).join('')}</select></label>
  <div class="row2"><label>Type<select id="st1">${opt(['Parent conference','Parent-teacher-counselor conference','Guidance consultation'])}</select></label><label>Language<select id="sl1"><option value="en">English</option><option value="fil">Filipino</option></select></label></div>
  <div class="row2"><label>Date<input id="sd1" type="date" value="${d0}" min="${iso(0)}" oninput="$('stm').innerHTML=slotOpts(this.value)"></label><label>Time<select id="stm">${slotOpts(d0)}</select></label></div><label>Venue<select id="sloc">${opt(LOCS)}</select></label><button class="btn y">Schedule and notify parent</button></form></div>
  <div class="blk"><h3>Daily agenda</h3><label style="margin-top:0">Pick a date<input type="date" value="${S.day||iso(0)}" oninput="S.day=this.value;$('dv').innerHTML=dayView()"></label><div id="dv">${dayView()}</div></div></div>
  <div class="cols b" style="margin-top:20px"><div class="blk fm"><h3>Conferences</h3>
  ${L.map(a=>{const p=pp(apP(a));return `<div class="item"><div><b>${p.name}</b><br><span class="mute">${a.type}, ${fmt(a.d)} at ${a.t}, ${esc(a.loc||'Guidance Office')}${a.why?'. “'+esc(a.why)+'”':''}</span></div>${apTag(a)}
  ${a.st=='Requested'?`<div class="row2"><button class="btn s" onclick="apprReq(${a.id})">Approve</button><button class="btn s o" onclick="S.modal='dc${a.id}';render()">Decline</button></div>`:a.st=='Reschedule requested'?`<div class="row2"><button class="btn s" onclick="resched(${a.id},1)">Approve ${fmt(a.rq.d)}, ${a.rq.t}</button><button class="btn s o" onclick="resched(${a.id},0)">Keep original</button></div>`:a.st=='Delivered'?`<div class="row2"><button class="btn s o" onclick="remind(${a.id})">Send reminder</button></div>`:a.st=='Confirmed'&&a.d<=iso(0)?`<div class="row2"><button class="btn s" onclick="mark(${a.id},'Attended')">Attended</button><button class="btn s o" onclick="mark(${a.id},'No-show')">No-show</button></div>`:''}</div>`}).join('')}</div>
  <div class="blk y"><h3>Notices sent</h3>${S.sms.map(x=>`<div class="sms"><span class="ch">${x.ch}</span> ${sent(x)}${gw(x)} <span class="mute">${pp(x.p).name}, ${x.w}</span><br>${esc(x.m)}</div>`).join('')}</div></div>`}
  /* ---- learners ---- */
  const pst=id=>{const c=S.cases.filter(x=>x.p==id);return c.some(x=>x.st=='New')?['New referral','New']:c.some(x=>x.st=='Ongoing')?['Ongoing case','Ongoing']:(c.length||S.old.some(o=>o.p==id))?['Past record','Closed']:['No record','']};
  function kidRows(){const q=S.q.trim().toLowerCase();return P.filter(p=>(!q||(p.name+p.lrn).toLowerCase().includes(q))&&(!S.fg||p.gr.startsWith(S.fg))).map(p=>{const s=pst(p.id),o=S.open==p.id;
  return `<div class="item" style="display:block"><div class="item" style="border:0;padding:0"><div><b>${p.name}</b><br><span class="mute">${p.gr}, adviser ${adv(p)}, LRN ${p.lrn}</span></div>${s[1]?`<span class="tag ${s[1]}">${s[0]}</span>`:`<span class="mute">${s[0]}</span>`}<button class="btn s o" onclick="S.open=${o?0:p.id};$('kl').innerHTML=kidRows()" aria-expanded="${o}">${o?'Hide':'Details'}</button></div>
  ${o?`<div class="note"><b>Observations</b>${S.obs.filter(x=>x.p==p.id).map(x=>`<br><span class="mute">${fmt(x.d)}</span> ${esc(x.t)}`).join('')||'<br><span class="mute">None yet.</span>'}</div>${S.old.filter(x=>x.p==p.id).map(x=>`<div class="note"><b>${x.sy}: ${x.c}</b><br>${esc(x.n)}</div>`).join('')}<textarea id="ob${p.id}" rows="2" aria-label="New observation"></textarea><button class="btn s o" style="margin-top:8px" onclick="addObs(${p.id})">Save observation</button>`:''}</div>`}).join('')||'<p class="empty">No learner matches. Check the spelling or the 12-digit LRN.</p>'}
  function addObs(id){const v=$('ob'+id).value.trim();if(!v)return toast('Write an observation first.');S.obs.unshift({p:id,d:iso(0),t:v});save();toast('Observation saved.');$('kl').innerHTML=kidRows()}
  function vKids(){return `<h2>Learners</h2><p class="lede">${P.length} enrolled pupils. Search by name or LRN.</p><div class="blk"><div class="row2"><label style="margin-top:0">Find a learner<input id="q" value="${esc(S.q)}" oninput="S.q=this.value;$('kl').innerHTML=kidRows()"></label>
  <label style="margin-top:0">Grade<select onchange="S.fg=this.value;$('kl').innerHTML=kidRows()"><option value="">All</option>${[1,2,3,4,5,6].map(g=>`<option ${S.fg=='Grade '+g?'selected':''} value="Grade ${g}">Grade ${g}</option>`).join('')}</select></label></div>
  <button class="btn s o" style="margin-top:10px" onclick="S.modal='addp';render()">Add a learner</button><div id="kl">${kidRows()}</div></div>`}

  /* ---- vault ---- */
function docRows(){const q=S.dq.toLowerCase();return S.docs.filter(d=>!q||(d.name+d.text+(d.raw||'')+d.lrn+(d.cat||'')+(d.pn||'')).toLowerCase().includes(q)).map(d=>`<div class="item" style="display:block"><b>${esc(d.name)}</b> <span class="tag good">${esc(d.cat||'Intake interview')}</span> <span class="mute">${esc(d.pn||(P.find(p=>p.lrn==d.lrn)||{}).name||'')}, LRN ${d.lrn}, ${fmt(d.d)}</span>${d.img?`<img alt="Scan of ${esc(d.name)}" src="${d.img}" style="width:120px;border:1px solid var(--line);border-radius:6px;margin:8px 0;display:block">`:''}
 ${d.f?`<div class="note">${[['Grade and section',(d.f.grade?'Grade '+d.f.grade:'')+(d.f.section?', '+d.f.section:'')],['Adviser/Teacher',d.f.adviser],['Violation',d.f.violation],['Type of Intervention',d.f.intervention],['Guardian/Parent',d.f.guardian],['Scanned Date',d.f.date?fmt(d.f.date):'']].map(([k,v])=>`<span class="mute">${k}:</span> ${esc(v||'Not given')}`).join('<br>')}</div><details><summary class="mute" style="cursor:pointer">Text read from the form</summary><pre>${esc(d.raw||d.text)}</pre></details>`:`<pre>${esc(d.text)}</pre>`}</div>`).join('')||'<p class="empty">No saved form matches.</p>'}
const ago=t=>{const m=Math.max(0,Math.round((Date.now()-t)/6e4));return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
/* ---- vault scan: capture, clean up, read, confirm ---- */
const SC=()=>S.sc||(S.sc={stage:'idle',exp:0});
let CAM=null;
function stopCam(){if(CAM){CAM.getTracks().forEach(t=>t.stop());CAM=null}}
const STEPS=['Capture','Clean up','Read','Confirm'],STIX={idle:0,cam:0,pre:1,read:2,review:3};
const stepper=st=>`<div class="pills" style="margin:0 0 14px">${STEPS.map((x,i)=>{const n=STIX[st];return `<span class="tag ${i<n?'good':i==n?'warn':''}" ${i>n?'style="color:var(--mute);border-color:var(--line)"':''}>${i<n?'✓':i+1} ${x}</span>`}).join('')}</div>`;
const VF=['Matched','Check this'],RD=['Read','Missing'],fl2=(ok,t)=>`<span class="tag ${ok?'good':'warn'}">${ok?t[0]:t[1]}</span>`;
function scanPanel(){const c=SC(),st=c.stage;let h=stepper(st);
 if(st=='idle')h+=`<p class="mute">Take a clear photo of the whole form. We clean up the photo first, then read it, then you confirm what we found.</p>
 <label for="op">Expected pupil (optional)</label><select id="op" onchange="SC().exp=+this.value"><option value="0">Detect from the form</option>${P.map(p=>`<option value="${p.id}" ${c.exp==p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
 <div class="row2" style="margin-top:12px"><button class="btn" style="margin-top:0" onclick="startCam()">Open camera</button><label class="btn o" style="margin:0;display:flex;align-items:center;justify-content:center;cursor:pointer">Upload photo or PDF<input id="of" type="file" accept="image/*,.pdf" style="display:none" onchange="pickFile(this)"></label></div>`;
 if(st=='cam')h+=`<div style="position:relative;border-radius:10px;overflow:hidden;background:#0f172a"><video id="vid" autoplay playsinline muted style="width:100%;display:block;max-height:60vh"></video><div style="position:absolute;inset:8% 6%;border:3px dashed rgba(255,255,255,.85);border-radius:10px;pointer-events:none"></div></div>
 <p class="mute">Fit the whole form inside the frame. Avoid shadows and glare. Hold steady.</p><div class="row2"><button class="btn" onclick="takePhoto()">Capture</button><button class="btn o" onclick="cancelScan()">Cancel</button></div>`;
 if(st=='pre'){const bad=c.q.some(x=>!x.ok),im='style="width:100%;border:1px solid var(--line);border-radius:8px;display:block"';
  h+=c.before?`<div class="row2"><div><span class="mute">Before</span><img alt="Original photo" src="${c.before}" ${im}></div><div><span class="mute">After clean-up</span><img alt="Cleaned photo" src="${c.after}" ${im}></div></div>`:'';
  h+=`<h3 style="margin-top:14px">Photo check</h3>${c.q.map(x=>`<div class="item" style="padding:6px 0"><div><b>${x.n}</b><br><span class="mute">${x.m}</span></div><span class="tag ${x.ok?'good':'warn'}">${x.ok?'Good':'Check'}</span></div>`).join('')}
  <div class="pills" style="margin-top:8px">${c.did.map(x=>`<span class="tag good">✓ ${x}</span>`).join('')}</div>
  ${bad?'<p class="err">This photo may be hard to read. Retake it for a better result, or use it anyway.</p>':''}
  <div class="row2"><button class="btn" onclick="runRead()">${bad?'Use anyway and read':'Read the form'}</button><button class="btn o" onclick="cancelScan()">Retake</button></div>`}
 if(st=='read')h+=`<p class="mute" id="rmsg">Reading the text on the form…</p><div class="bar" style="grid-template-columns:90px 1fr 40px"><span>Reading</span><i id="rbar" style="width:4%;transition:width .3s"></i><b id="rpct">0%</b></div>`;
 if(st=='review'){const r=c.rev,f=r.f,im='style="width:100%;max-height:240px;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:8px;display:block"';
  h+=(r.sim?`<div class="note"><b>Demo reading.</b> The text engine could not load here (no internet), so sample text stands in for the real scan. Your photo is kept with the record.</div>`:`<p class="mute">Read with Tesseract.js, ${r.conf}% confidence.</p>`)+(r.note?`<div class="note">${esc(r.note)}</div>`:'')+
  (c.before?`<div class="row2"><div><span class="mute">Your photo</span><img alt="Your photo" src="${c.before}" ${im}></div><div><span class="mute">Cleaned for reading</span><img alt="Cleaned photo" src="${c.after}" ${im}></div></div>`:`<div class="note"><b>${esc(c.name)}</b><br><span class="mute">PDF file. No photo preview.</span></div>`)+
  `<h3 style="margin-top:16px">Intake interview details</h3><p class="mute">Check each field against the paper form. Fix anything that is wrong.</p>
  <div class="row2"><label>LRN ${fl2(r.fl.lrn,VF)}<input id="ol" value="${esc(f.lrn)}" maxlength="12" inputmode="numeric" oninput="onMatch()"></label><label>Learner ${fl2(r.fl.name,VF)}<input id="on" value="${esc(f.name)}" oninput="onMatch()"></label></div><p id="mline" class="mute" style="margin:8px 0 0"></p>
  <div class="row2"><label>Grade ${fl2(r.fl.grade,VF)}<input id="og" value="${esc(f.grade)}" maxlength="1" inputmode="numeric"></label><label>Section ${fl2(r.fl.section,VF)}<input id="os" value="${esc(f.section)}"></label></div>
  <div class="row2"><label>Adviser/Teacher ${fl2(r.fl.adviser,VF)}<input id="oa" value="${esc(f.adviser)}"></label><label>Guardian/Parent ${fl2(r.fl.guardian,VF)}<input id="ogd" value="${esc(f.guardian)}"></label></div>
  <label>Violation ${fl2(r.fl.violation,RD)}<input id="ov" list="vl" value="${esc(f.violation)}"></label><datalist id="vl">${CONCERNS.map(x=>`<option value="${x}">`).join('')}</datalist>
  <label>Type of Intervention ${fl2(r.fl.intervention,RD)}<input id="oi" list="il" value="${esc(f.intervention)}"></label><datalist id="il">${['Parent conference','Parent-teacher-counselor conference','Guidance consultation','Counseling session','Peer mediation','Home visit','Referral'].map(x=>`<option value="${x}">`).join('')}</datalist>
  <div class="row2"><label>Scanned Date ${fl2(r.fl.date,RD)}<input id="od" type="date" value="${f.date}"></label><label>Document type ${fl2(r.fl.cat,['Read','Guessed'])}<select id="oc">${opt(DOCCATS,r.cat)}</select></label></div>
  <details style="margin-top:12px"><summary class="mute" style="cursor:pointer">Text read from the form</summary><textarea id="ot" rows="6" style="font:12.5px/1.5 ui-monospace,monospace">${esc(r.text)}</textarea></details>
  <div class="row2"><button class="btn y" onclick="saveOcr()">Confirm and save to vault</button><button class="btn o" onclick="cancelScan()">Scan again</button></div>`}
 return h}
function vVault(){return `<h2>Calamity Vault</h2><p class="lede">Scan a paper form so it survives the next flood or fire. The photo is cleaned up, read with Tesseract.js, and checked against the learner list before it is filed.</p><div class="cols b"><div class="stack"><div class="blk"><h3>Scan a form</h3>${scanPanel()}</div>
 <div class="blk"><h3>Cloud backup</h3><p class="mute">Cases, scanned forms, and helpdesk chats are copied to cloud storage every night. Last backup: <b>${ago(S.bk.at)}</b>.</p><p class="mute">${S.cases.length} cases, ${S.docs.length} scanned forms, ${S.chats.length} chat threads, and ${P.length} learner profiles are protected.</p>
 <div class="row2"><button class="btn s" onclick="backup()">Back up now</button><button class="btn s o" onclick="dlBackup()">Download a copy</button></div><label for="rf">Restore from a backup file</label><input id="rf" type="file" accept=".json" onchange="restore(this)"></div></div>
 <div class="blk y"><h3>Saved forms (${S.docs.length})</h3><label for="dq" style="margin-top:0">Search by name, LRN, or text</label><input id="dq" value="${esc(S.dq)}" oninput="S.dq=this.value;$('dl').innerHTML=docRows()"><div id="dl">${docRows()}</div></div></div>`}
/* capture */
async function startCam(){if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)return toast('Camera is not available here. Upload a photo instead.',4000);
 try{CAM=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920}}})}catch(e){return toast('Camera is blocked or missing. Upload a photo instead.',4000)}
 SC().stage='cam';render();$('vid').srcObject=CAM}
function takePhoto(){const v=$('vid');if(!v||!v.videoWidth)return toast('The camera is still starting.');const cv=document.createElement('canvas');cv.width=v.videoWidth;cv.height=v.videoHeight;cv.getContext('2d').drawImage(v,0,0);stopCam();
 const im=new Image();im.onload=()=>analyse(im,'Camera scan '+iso(0)+'.jpg');im.src=cv.toDataURL('image/jpeg',.92)}
function cancelScan(){stopCam();const e=SC().exp;S.sc={stage:'idle',exp:e};render()}
function pickFile(i){const f=i.files[0];if(!f)return;const e=SC().exp;
 if(/pdf/i.test(f.type)||/\.pdf$/i.test(f.name)){S.sc={stage:'pre',exp:e,name:f.name,pdf:true,before:'',after:'',thumb:'',q:[{n:'File type',m:'PDF document. Pages are cleaned up while reading.',ok:true}],did:['PDF accepted']};return render()}
 const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{analyse(im,f.name);URL.revokeObjectURL(u)};im.onerror=()=>toast('That file could not be opened as a picture.');im.src=u}
/* pre-process: measure the photo, then grayscale + contrast stretch */
function analyse(img,name){const e=SC().exp,W0=img.naturalWidth,H0=img.naturalHeight,k=Math.min(1,1400/Math.max(W0,H0)),w=Math.max(1,Math.round(W0*k)),h=Math.max(1,Math.round(H0*k));
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,w,h);
 const sm=(src,tw,q)=>{const t=document.createElement('canvas');t.width=tw;t.height=Math.round(tw*src.height/src.width);t.getContext('2d').drawImage(src,0,0,t.width,t.height);return t.toDataURL('image/jpeg',q)};
 const before=sm(cv,Math.min(w,480),.8),d=x.getImageData(0,0,w,h),a=d.data,n=w*h,g=new Uint8ClampedArray(n);let sum=0;
 for(let i=0;i<n;i++){const v=.299*a[i*4]+.587*a[i*4+1]+.114*a[i*4+2];g[i]=v;sum+=v}
 const mean=sum/n;let vs=0;for(let i=0;i<n;i++)vs+=(g[i]-mean)**2;const sd=Math.sqrt(vs/n);
 let lm=0,ls=0,cnt=0;for(let y=1;y<h-1;y+=2)for(let xx=1;xx<w-1;xx+=2){const i=y*w+xx,l=4*g[i]-g[i-1]-g[i+1]-g[i-w]-g[i+w];lm+=l;ls+=l*l;cnt++}
 const lap=cnt?ls/cnt-(lm/cnt)**2:0,hist=new Uint32Array(256);for(let i=0;i<n;i++)hist[g[i]]++;
 let lo=0,hi=255,acc=0;for(let v=0;v<256;v++){acc+=hist[v];if(acc>n*.02){lo=v;break}}acc=0;for(let v=255;v>=0;v--){acc+=hist[v];if(acc>n*.02){hi=v;break}}if(hi-lo<20){lo=0;hi=255}
 for(let i=0;i<n;i++){const v=Math.max(0,Math.min(255,(g[i]-lo)*255/(hi-lo)));a[i*4]=a[i*4+1]=a[i*4+2]=v}x.putImageData(d,0,0);
 const q=[{n:'Lighting',ok:mean>=70&&mean<=248,m:mean<70?'Too dark. Move to a brighter spot.':mean>248?'Washed out. Avoid glare and flash.':'Even and bright enough.'},
  {n:'Text contrast',ok:sd>=28,m:sd<28?'Writing looks faint. Move closer or add light.':'Writing stands out from the paper.'},
  {n:'Sharpness',ok:lap>=30,m:lap<30?'The photo looks blurry. Hold steady and retake.':'Letters are crisp.'},
  {n:'Size',ok:Math.max(W0,H0)>=800,m:Math.max(W0,H0)<800?'Low resolution ('+W0+'×'+H0+'). Retake closer.':W0+'×'+H0+' pixels.'}];
 S.sc={stage:'pre',exp:e,name,before,after:cv.toDataURL('image/jpeg',.9),thumb:sm(cv,240,.6),q,did:['Resized for reading','Grayscale','Contrast boost']};render()}
/* read: Tesseract.js when it can load, demo text otherwise */
const loadScript=u=>new Promise((ok,no)=>{const e=document.createElement('script');e.src=u;e.onload=ok;e.onerror=no;document.head.appendChild(e)});
const hashS=t=>[...t].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
const catOf=t=>/intake/i.test(t)?'Intake interview':/anecdot/i.test(t)?'Anecdotal record':/consent|permission/i.test(t)?'Consent form':/refer/i.test(t)?'Referral slip':'';
async function runRead(){const c=SC();c.stage='read';render();let text='',conf=0,sim=false;
 const bar=p=>{const b=$('rbar');if(b){b.style.width=Math.max(4,p)+'%';$('rpct').textContent=p+'%'}};
 try{if(c.pdf)throw 0;if(!window.Tesseract)await Promise.race([loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js'),new Promise((_,no)=>setTimeout(no,8000))]);
  const r=await Promise.race([Tesseract.recognize(c.after,'eng',{logger:m=>{if(m.status=='recognizing text')bar(Math.round(m.progress*100))}}),new Promise((_,no)=>setTimeout(no,60000))]);text=r.data.text;conf=Math.round(r.data.confidence)}
 catch(e){sim=true;const fw=words(c.name),p=c.exp?pp(c.exp):P.find(x=>words(x.name).every(k=>fw.includes(k)))||P[hashS(c.name)%P.length];for(let i=10;i<=100;i+=30){bar(i);await new Promise(r=>setTimeout(r,150))}
  const cc=S.cases.find(x=>x.p==p.id),ap=S.appts.find(x=>x.k&&apP(x)==p.id),pa=parentOf(p.id),gs=p.gr.replace('Grade ','').split(' – ');
  text=compose({lrn:p.lrn,name:p.name,grade:gs[0],section:gs[1]||'',adviser:adv(p),violation:cc?cc.c+(cc.bt?' ('+cc.bt+')':''):'Peer conflict',intervention:ap?ap.type:'Counseling session',guardian:pa?pa.name:'Not on file',date:iso(0)},catOf(c.name)||'Intake interview')}
 if(S.sc!==c)return;c.rev=parseForm(text,c.exp,c.name);c.rev.sim=sim;c.rev.conf=conf;c.stage='review';render();onMatch();toast('Form read. Please confirm the details.')}
/* post-process: fix look-alike characters, find the LRN, match the learner, guess the form type */
const words=s=>s.toLowerCase().replace(/[^a-zñ ]/g,' ').split(/\s+/).filter(Boolean);
const lev=(a,b)=>{const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]==b[j-1]?0:1));p=t}}return m[b.length]};
const ham=(a,b)=>a.length!=b.length?99:[...a].filter((ch,i)=>ch!=b[i]).length;
function findLrn(t){const fix=v=>v.replace(/[Oo]/g,'0').replace(/[lIi|]/g,'1').replace(/[Ss]/g,'5').replace(/B/g,'8').replace(/\D/g,'');
 for(const ln of t.split(/\n/)){if(/lrn|learner reference/i.test(ln)){const v=fix(ln.replace(/^.*?(lrn|learner reference( no\.?| number)?)[:#.\s-]*/i,''));if(v.length>=12)return v.slice(0,12)}}
 const m=t.replace(/(\d)[ -](?=\d)/g,'$1').match(/\d{12}/);return m?m[0]:''}
function findKid(t,lrn){let p=P.find(x=>x.lrn==lrn);if(p)return{p,how:'lrn'};const tw=words(t);
 p=P.find(x=>{const tk=words(x.name);return tk.length&&tk.every(k=>tw.some(w=>w==k||(k.length>=5&&lev(w,k)<=1)))});if(p)return{p,how:'name'};
 p=lrn&&P.find(x=>ham(x.lrn,lrn)<=2);return p?{p,how:'near'}:{p:null}}
const compose=(f,cat)=>`${cat.toUpperCase()}, SRES GUIDANCE OFFICE\nLRN ${f.lrn}\nLearner: ${f.name}\nGrade: ${f.grade}\nSection: ${f.section}\nAdviser/Teacher: ${f.adviser}\nViolation: ${f.violation}\nType of Intervention: ${f.intervention}\nGuardian/Parent: ${f.guardian}\nScanned Date: ${f.date?fmt(f.date):''}`;
const LBL={lrn:/^\s*(?:LRN|Learner Reference(?: No\.?| Number)?)\s*[:#.\-]?\s*(.*)$/i,name:/^\s*(?:Learner|Name|Pupil)\s*[:\-]\s*(.*)$/i,grade:/^\s*Grade(?: Level)?\s*[:\-]?\s*(.*)$/i,section:/^\s*Section\s*[:\-]?\s*(.*)$/i,adviser:/^\s*(?:Adviser|Advisor|Teacher)(?:\s*\/\s*(?:Adviser|Advisor|Teacher))?\s*[:\-]?\s*(.*)$/i,violation:/^\s*(?:Violation|Offense)\s*[:\-]?\s*(.*)$/i,intervention:/^\s*(?:Type of )?Intervention\s*[:\-]?\s*(.*)$/i,guardian:/^\s*(?:Guardian|Parent)(?:\s*\/\s*(?:Guardian|Parent))?\s*[:\-]?\s*(.*)$/i,date:/^\s*(?:Scanned )?Date(?: Scanned)?\s*[:\-]?\s*(.*)$/i};
function readFields(t){const f={};t.split(/\n/).forEach(ln=>{for(const k in LBL){const m=ln.match(LBL[k]);if(m&&f[k]===undefined){f[k]=m[1].trim();break}}});return f}
const readDate=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':ld(d)};
function parseForm(text,exp,fname){const rf=readFields(text),lrn=findLrn(text),m=findKid(text,lrn),kw=catOf(text),cat=kw||catOf(fname)||'Intake interview',dt=readDate(rf.date);
 const f={lrn,name:rf.name||'',grade:(rf.grade||'').replace(/\D/g,'').slice(0,1),section:rf.section||'',adviser:rf.adviser||'',violation:rf.violation||'',intervention:rf.intervention||'',guardian:rf.guardian||'',date:dt||iso(0)},r={text:text.trim(),cat,f,note:'',fl:{cat:!!kw,date:!!dt,violation:!!rf.violation,intervention:!!rf.intervention}};
 const kid=m.p||(exp?pp(exp):null);
 if(kid){const rec=kid.gr.replace('Grade ','').split(' – '),pa=parentOf(kid.id),chk=(k,v)=>{if(!f[k]){f[k]=v;r.fl[k]=false}else r.fl[k]=m.p?norm(f[k])==norm(v):false};
  f.lrn=kid.lrn;f.name=kid.name;r.fl.lrn=m.how=='lrn';r.fl.name=!!m.p;chk('grade',rec[0]);chk('section',rec[1]||'');chk('adviser',adv(kid));
  if(pa){if(!f.guardian){f.guardian=pa.name;r.fl.guardian=false}else r.fl.guardian=!!m.p&&words(f.guardian).some(w=>w.length>3&&words(pa.name).includes(w))}else r.fl.guardian=!!f.guardian}
 else{const nm=text.match(/(?:learner|name)\s*[:\-]\s*([^,\n]+)/i);f.name=nm?nm[1].trim():f.name;['lrn','name','grade','section','adviser','guardian'].forEach(k=>r.fl[k]=false)}
 if(m.how=='name')r.note='The LRN was not clear on the scan, so we filled it from the pupil’s name. Please check it.';
 if(m.how=='near')r.note='The scan read LRN '+lrn+', which is close to '+kid.lrn+'. We corrected it. Please check it.';
 if(!m.p&&!exp)r.note='No learner on the list matched this form. Check the LRN and name, or add the learner first.';
 if(!m.p&&exp)r.note='We could not find a learner on the scan, so we used the pupil you picked. Check it against the text.';
 if(exp&&m.p&&m.p.id!=exp){r.fl.name=false;r.note='This form looks like it belongs to '+m.p.name+', not '+pp(exp).name+'. Check before saving.'}
 const miss=['grade','section','adviser'].filter(k=>!rf[k]);if(m.p&&miss.length&&!r.note)r.note='Some fields were blank on the scan, so we filled them from the learner record. Check them.';
 return r}
function onMatch(){const l=dig($('ol').value),p=P.find(x=>x.lrn==l),n=norm($('on').value);$('mline').innerHTML=p?(norm(p.name)==n?`<span class="tag good">Matched</span> ${esc(p.name)}, ${p.gr}`:`<span class="tag warn">Name differs</span> LRN ${l} belongs to ${esc(p.name)}.`):'<span class="tag warn">No match</span> No learner has this LRN.'}
function saveOcr(){const c=SC(),l=dig($('ol').value),p=P.find(x=>x.lrn==l);if(!p)return toast('That LRN is not on the learner list. Correct it first.');if(norm($('on').value)!=norm(p.name))return toast('The name does not match that LRN. Check both.');
 const g=i=>$(i).value.trim(),f={lrn:l,name:p.name,grade:g('og'),section:g('os'),adviser:g('oa'),violation:g('ov'),intervention:g('oi'),guardian:g('ogd'),date:$('od').value||iso(0)},cat=$('oc').value;
 S.docs.unshift({name:c.name,d:f.date,lrn:l,pn:p.name,cat,f,text:compose(f,cat),raw:g('ot')||c.rev.text,img:c.thumb||''});S.sc=null;S.bk.at=Date.now();save();toast('Filed under '+p.name+' and backed up.');render()}
function backup(){S.bk.at=Date.now();save();toast('Backup saved to the cloud (simulated).');render()}
function dlBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([snap()],{type:'application/json'}));a.download='kalinga-backup-'+iso(0)+'.json';a.click();toast('Backup file downloaded.')}
function restore(i){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(!j.cases||!j.P)throw 0;localStorage.setItem(KEY,r.result);location.reload()}catch(e){toast('That file is not a Kalinga backup.')}};r.readAsText(f)}
  /* ---- chat ---- */
  const bubbles=(c,me)=>c.msgs.map(m=>`<div class="m ${m.s==me?'me':'them'}">${esc(m.t)}<small>${m.tm}</small></div>`).join('');
  function vDesk(){const L=S.chats,c=L.find(x=>x.id==S.chat)||L[0];
  return `<div class="top"><div><h2>Helpdesk</h2><p class="lede">Chats from the QR poster. A pupil’s access closes after 7 days, but the encrypted record stays here.</p></div><button class="btn s o" onclick="S.modal='qr';render()">QR poster</button></div><div class="cols a"><div class="blk"><h3>Threads</h3>
  ${L.map(x=>`<div class="item ${c&&x.id==c.id?'sel':''}"><div><b>${esc(x.alias)}</b><br><span class="mute">${x.cat}, feeling ${x.mood.toLowerCase()}${live(x)?'':', pupil access closed'}</span></div><span class="tag ${x.anon?'warn':'good'}">${x.anon?'Anonymous':'Identified'}</span><button class="btn s o" onclick="S.chat=${x.id};render()" aria-label="Open thread ${esc(x.alias)}">Open</button></div>`).join('')||'<p class="empty">No threads yet.</p>'}</div>
  <div class="blk y">${c?`<div class="item" style="padding-top:0"><div><h3>${esc(c.alias)}</h3><span class="mute">Code ${c.code}. ${c.anon?'Anonymous Mode':'Identity shared'}. ${live(c)?'Pupil access ends '+new Date(exp(c)).toLocaleDateString('en-PH',{month:'short',day:'numeric'}):'Pupil access closed.'}${c.keep?' Kept as a case.':''} Encrypted.</span></div><button class="btn s y" onclick="toCase(${c.id})">Turn into a case</button></div>
  <div class="chat" id="cb">${bubbles(c,'g')}</div>${live(c)?`<div class="send"><input id="gm" aria-label="Reply" placeholder="Write a reply" onkeydown="if(event.key==='Enter')gsend(${c.id})"><button class="btn" onclick="gsend(${c.id})">Send</button></div>`:'<p class="mute" style="margin-top:10px">This pupil’s 7-day access has closed, so replies are off. You can still read the record or turn it into a case.</p>'}`:'<p class="empty">Open a thread to read it.</p>'}</div></div>`}
  function gsend(id){if(!live(S.chats.find(c=>c.id==id)))return toast('This pupil’s access has closed.');const v=$('gm').value.trim();if(!v)return toast('Write a reply first.');S.chats.find(c=>c.id==id).msgs.push({s:'g',t:v,tm:now()});save();render('gm')}
  function toCase(id){const c=S.chats.find(x=>x.id==id);if(!c.pid)return toast('This pupil has not shared who they are yet. Ask them in the chat.');
  c.keep=true;S.cases.unshift({id:++S.seq,p:c.pid,c:CONCERNS.includes(c.cat)?c.cat:c.cat=='School stress'?'Academic difficulty':'Family concern',u:'Urgent',st:'New',by:'Helpdesk chat '+c.code,d:iso(0),desc:'Opened from a helpdesk chat. Pupil felt '+c.mood.toLowerCase()+'.',notes:[]});S.sel=S.seq;save();toast('Case opened.');go('cases')}
  function vPupil(){const c=S.chats.find(x=>x.id==S.chat&&live(x));
  const top=`<div class="pup"><button class="lk" onclick="S.pupil=false;S.chat=null;render()">Back to log in</button><h2 style="margin-top:12px">You can tell us anything.</h2><p class="lede" style="margin-bottom:0">A counselor reads this. Nobody sees your name unless you choose to share it.</p></div>`;
  if(!c)return top+`<div class="cols b"><div class="blk"><h3>How are you feeling?</h3><div class="pills">${MOODS.map(m=>`<button aria-pressed="${S.mood==m}" onclick="S.mood='${m}';render()">${m}</button>`).join('')}</div>
  <h3 style="margin-top:22px">What is it about?</h3><div class="pills">${['Bullying','Peer conflict','School stress','Family concern'].map(m=>`<button aria-pressed="${S.cat==m}" onclick="S.cat='${m}';render()">${m}</button>`).join('')}</div>
  <button class="btn o" style="margin-top:24px" onclick="S.modal='resume';render()">Continue my chat</button></div>
  <div class="blk y"><h3>Start a chat</h3><label for="pn" style="margin-top:0">Pick a 4-digit PIN you will remember</label><input id="pn" type="password" inputmode="numeric" maxlength="4" autocomplete="off"><label for="pm">Your message</label><textarea id="pm" rows="3"></textarea>
  <p id="pe" class="err" role="alert"></p><button class="btn y" onclick="pstart()">Send</button><p class="mute">You will get a code like K-8392. Chats close by themselves after 7 days.</p></div></div>`;
  return top+`<div class="cols b"><div class="blk"><h3>Your chat code</h3><span class="code">${c.code}</span> <span class="tag ${c.anon?'warn':'good'}">${c.anon?'Anonymous Mode':'Identity shared'}</span><p class="mute">Keep this and your PIN. Use them to come back until ${new Date(exp(c)).toLocaleDateString('en-PH',{month:'long',day:'numeric'})}.</p>
  ${c.anon?`<button class="btn o" onclick="S.modal='id';render()">Share My Identity</button>`:`<p class="mute">The counselor knows you are ${esc(c.alias)}.</p>`}
  <button class="btn o" style="display:block" onclick="S.chat=null;render()">Close this chat on this screen</button></div>
  <div class="blk y"><h3>Chat</h3><div class="chat" id="cb">${bubbles(c,'p')}</div><div class="send"><input id="pm" aria-label="Your message" placeholder="Write here" onkeydown="if(event.key==='Enter')psend()"><button class="btn" onclick="psend()">Send</button></div></div></div>`}
  function pstart(){const pin=$('pn').value.trim(),v=$('pm').value.trim();if(!/^\d{4}$/.test(pin))return $('pe').textContent='Your PIN must be exactly 4 numbers.';if(!v)return $('pe').textContent='Write a message so the counselor knows how to help.';
  let code;do code='K-'+(1000+Math.floor(Math.random()*9000));while(S.chats.some(x=>x.code==code));
  const c={id:++S.seq,code,pin,anon:true,alias:'Anonymous pupil',pid:0,cat:S.cat,mood:S.mood,at:Date.now(),keep:false,msgs:[{s:'p',t:v,tm:now()}]};S.chats.unshift(c);S.chat=c.id;save();render('pm');auto(c)}
  function auto(c){setTimeout(()=>{if(c.msgs.length==1){c.msgs.push({s:'g',t:'Thank you for telling us. You are safe here. A counselor will read this and reply soon.',tm:now()});save();if(S.pupil)render('pm')}},1100)}
  function psend(){const v=$('pm').value.trim();if(!v)return toast('Write a message first.');const c=S.chats.find(x=>x.id==S.chat);c.msgs.push({s:'p',t:v,tm:now()});save();render('pm')}
  /* ---- teacher (section-bound, no notes) ---- */
  const mine=()=>{const m=P.filter(p=>adv(p)==S.user.name);return m.length?m:P};
  function vTeacher(){const M=mine(),ids=M.map(p=>p.id),cl=S.cases.filter(c=>ids.includes(c.p)),ap=S.appts.filter(a=>ids.includes(apP(a))),T=S.tab;
  const body=T=='refer'?`<div class="cols b"><div class="blk"><form onsubmit="refer(event)"><label for="rp" style="margin-top:0">Pupil in your section</label><select id="rp">${M.map(p=>`<option value="${p.id}">${p.name}, ${p.gr}</option>`).join('')}</select>
  <label for="rc">Concern</label><select id="rc">${opt(CONCERNS)}</select><label for="ru">Urgency</label><select id="ru">${opt(['Normal','Urgent'])}</select><label for="rb">Type of bullying (only if bullying)</label><select id="rb"><option value="">Not applicable</option>${BTYPES.map(b=>`<option>${b}</option>`).join('')}</select><label for="rd">What did you see or hear?</label><textarea id="rd" rows="3" placeholder="Facts only: what happened, where, when."></textarea><button class="btn y">Send referral</button></form></div>
  <div class="blk y"><h3>Your class</h3><p class="mute">${M.map(p=>p.name).join(', ')}</p></div></div>`
  :T=='track'?`<div class="blk"><h3>Referral progress</h3><p class="mute">You see status only. Counseling notes stay with the Guidance Office.</p>${cl.map(c=>`<div class="item"><div><b>${pp(c.p).name}</b><br><span class="mute">${c.c}${c.bt?' ('+c.bt+')':''}, referred ${fmt(c.d)}</span></div><span class="tag ${c.st}">${c.st}</span></div>`).join('')||'<p class="empty">No referrals for your section yet.</p>'}</div>`
  :T=='stats'?`<div class="cols b"><div class="blk"><h3>Referrals by concern</h3>${bars(CONCERNS.map(k=>[k,cl.filter(c=>c.c==k).length]).filter(r=>r[1]).sort((a,b)=>b[1]-a[1]))||'<p class="empty">No referrals yet.</p>'}</div>
  <div class="blk y"><h3>Referral status</h3>${bars(['New','Ongoing','Closed'].map(k=>[k,cl.filter(c=>c.st==k).length]))}</div></div>
  <div class="cols b" style="margin-top:20px"><div class="blk"><h3>Types of bullying</h3>${bars(btRows(cl))}</div><div class="blk y"><h3>Parent responses</h3>${bars([['Attended',ap.filter(a=>a.st=='Attended').length],['Confirmed',ap.filter(a=>a.st=='Confirmed').length],['Waiting for parent',ap.filter(a=>a.st=='Delivered').length],['Asked to reschedule',ap.filter(a=>a.st=='Reschedule requested').length]],'g')}</div></div><p class="mute" style="margin-top:14px">Counts cover your own section only. Counseling notes stay with the Guidance Office.</p>`
  :`<div class="blk"><h3>Call slips for your class</h3>${ap.map(a=>`<div class="item"><div><b>${pp(apP(a)).name}</b><br><span class="mute">${a.type}, ${fmt(a.d)} at ${a.t}, ${esc(a.loc||'Guidance Office')}</span></div>${apTag(a)}</div>`).join('')||'<p class="empty">No call slips sent yet.</p>'}</div>`;
  return `<h2>${S.user.name}</h2><p class="lede">${M.length} pupils in ${[...new Set(M.map(sec))].join(' and ')}.</p>${body}`}
  function refer(e){e.preventDefault();S.cases.unshift({id:++S.seq,p:+$('rp').value,c:$('rc').value,bt:$('rc').value=='Bullying'?$('rb').value:'',u:$('ru').value,st:'New',by:S.user.name,d:iso(0),desc:$('rd').value.trim()||'No details added.',notes:[]});save();toast('Referral sent to the Guidance Office.');go('track')}
  /* ---- parent ---- */
  function vParent(){const pa=S.parents.find(x=>x.id==S.user.pid),k=pa.kids.includes(S.kid)?S.kid:pa.kids[0],p=pp(k),ap=S.appts.filter(a=>apP(a)==k).sort((a,b)=>a.d.localeCompare(b.d)),lg=S.sms.filter(x=>x.p==k),fl=S.flash,d0=nwd(1);S.flash='';
  return `<h2>${pa.name}</h2><p class="lede">Conferences and notices about ${p.name}, ${p.gr}.</p>
  ${fl?`<div class="note" style="border-left-color:var(--success);background:var(--success-light)" role="status"><b>Done.</b> ${esc(fl)}</div>`:''}
  ${pa.kids.length>1?`<div class="pills" style="margin:0 0 16px">${pa.kids.map(i=>`<button aria-pressed="${i==k}" onclick="S.kid=${i};render()">${pp(i).name}</button>`).join('')}</div>`:''}
  <div class="cols b"><div class="blk y"><h3>Request a conference</h3><p class="mute">Pick a weekday and an open time. You get a message when we receive it and again when it is decided.</p>
  <form onsubmit="doReq(event)"><label style="margin-top:0">Type<select id="qy">${opt(['Parent conference','Guidance consultation','Parent-teacher-counselor conference'])}</select></label>
  <div class="row2"><label>Date<input id="qd" type="date" value="${d0}" min="${iso(0)}" oninput="$('qt').innerHTML=slotOpts(this.value)"></label><label>Time<select id="qt">${slotOpts(d0)}</select></label></div>
  <label>What would you like to talk about?<textarea id="qw" rows="3"></textarea></label><p id="qe" class="err" role="alert"></p><button class="btn">Send request</button></form></div>
  <div class="blk fm"><h3>Your conferences</h3>
  ${ap.map(a=>`<div class="item"><div><b>${a.type}</b><br>${fmt(a.d)} at ${a.t}, ${esc(a.loc||'Guidance Office')}<br>${apTag(a)}${a.rq?` <span class="mute">You asked for ${fmt(a.rq.d)}, ${a.rq.t}</span>`:''}${a.st=='Requested'?` <span class="mute">Request ${ref(a)}</span>`:''}${a.st=='Declined'?`<br><span class="mute">${esc(a.why2||'')}</span>`:''}</div>${a.st=='Delivered'?`<div class="row2"><button class="btn s" onclick="conf(${a.id})">I will attend</button><button class="btn s o" onclick="S.modal='rs${a.id}';render()">Ask for another time</button></div>`:''}</div>`).join('')||'<p class="empty">No conferences yet. Send a request on the left.</p>'}</div></div>
  <div class="blk" style="margin-top:20px"><h3>Notices received</h3>${lg.map(l=>`<div class="sms"><span class="ch">${l.ch}</span> ${sent(l)} <span class="mute">${l.w}</span><br>${esc(l.m)}${l.ch=='Email'&&l.a&&(S.appts.find(x=>x.id==l.a)||{}).st=='Delivered'?`<div class="row2" style="margin-top:8px"><button class="btn s" onclick="conf(${l.a})">I will attend</button><button class="btn s o" onclick="S.modal='rs${l.a}';render()">Ask for another time</button></div>`:''}</div>`).join('')||'<p class="empty">No notices yet.</p>'}
  <label for="pf">Send my notices by</label><select id="pf" onchange="S.parents.find(x=>x.id==${pa.id}).pref=this.value;save();toast('Saved.')">${opt(['SMS and email','SMS only','Email only'],pa.pref)}</select></div>`}
  function doReq(e){e.preventDefault();const pa=S.parents.find(x=>x.id==S.user.pid),k=pa.kids.includes(S.kid)?S.kid:pa.kids[0],p=pp(k),d=$('qd').value,t=$('qt').value,w=$('qw').value.trim(),ty=$('qy').value,E=m=>$('qe').textContent=m,er=okDate(d,0,t);
  if(er)return E(er);if(!w)return E('Tell us briefly what the conference is about.');
  const c=S.cases.find(x=>x.p==k&&x.st!='Closed'),a={id:++S.seq,k:c?c.id:null,p:k,type:ty,d,t,st:'Requested',rq:null,why:w};S.appts.push(a);
  notify(k,`San Roque ES Guidance: We received your request ${ref(a)} for a ${ty.toLowerCase()} for ${p.name} on ${fmt(d)} at ${t}. The Guidance Office will confirm it soon.`);
  S.flash=`Request ${ref(a)} was sent to the Guidance Office. A confirmation message went to you by ${chDesc(pa)}.`;save();render()}
  function conf(id){const a=S.appts.find(x=>x.id==id),p=pp(apP(a)),pa=parentOf(p.id);a.st='Confirmed';a.rq=null;notify(p.id,`San Roque ES Guidance: Thank you. We have your confirmation to attend the ${a.type.toLowerCase()} for ${p.name} on ${fmt(a.d)} at ${a.t}.`);S.flash='Attendance confirmed. The Guidance Office was told, and a message went to you by '+chDesc(pa)+'.';save();render()}
  /* ---- modals ---- */
  function modal(){const m=S.modal;let h='',isWide=false;const X=`<button class="btn o" type="button" onclick="S.modal=null;render()">Cancel</button>`;
  if(m&&m.startsWith('rs'))h=`<h3>Ask for another time</h3><form onsubmit="doRs(event,${m.slice(2)})"><label>New date<input id="rd2" type="date" value="${nwd(4)}" min="${iso(1)}"></label><label>Time<select id="rt">${opt(SLOTS)}</select></label><label>Why can you not come?<textarea id="rw" rows="3"></textarea></label><div class="row2"><button class="btn y">Send request</button>${X}</div></form>`;
  if(m&&m.startsWith('dc'))h=`<h3>Decline this request</h3><p class="mute">The parent gets your reason by message. Suggest another time if you can.</p><form onsubmit="doDecl(event,${m.slice(2)})"><label>Reason and a better time<textarea id="dr" rows="3"></textarea></label><div class="row2"><button class="btn y">Decline and notify</button>${X}</div></form>`;
  if(m==='id')h=`<h3>Share My Identity</h3><p class="mute">Only the guidance counselor will see this.</p><form onsubmit="doId(event)"><label>Full name<input id="in" autocomplete="off"></label><label>LRN (12 digits)<input id="il" inputmode="numeric" maxlength="12"></label><div class="row2"><label>Grade and section<select id="ig">${opt([...new Set(P.map(p=>p.gr))].sort())}</select></label><label>Class adviser<input id="ia" placeholder="Teacher Cruz"></label></div><div class="row2"><button class="btn y">Share my name</button><button class="btn o" type="button" onclick="S.modal=null;render()">Stay anonymous</button></div></form>`;
  if(m==='qr'){let svg='';try{const q=qrcode(0,'M');q.addData(location.href.split('#')[0]+'#helpdesk');q.make();svg=q.createSvgTag({cellSize:6,margin:0,scalable:true})}catch(e){svg='<p class="mute">The QR code could not be drawn.</p>'}
    h=`<h3>Helpdesk QR poster</h3><p class="mute">Print this and post it outside the Guidance Room. Pupils scan it with any phone. No login needed.</p><div class="qr" style="margin:12px auto">${svg}</div><p style="text-align:center;font-weight:700;margin:4px 0">Need to talk? Scan me.</p><p class="mute" style="text-align:center">Kalinga Helpdesk, San Roque Elementary School. You can stay anonymous.</p><div class="row2"><button class="btn y" onclick="printQr()">Print poster</button>${X}</div>`}
  if(m==='intake')h=`<h3>New intake interview</h3><p class="mute">Replaces the paper logbook. Visible to guidance only.</p><form onsubmit="doIntake(event)"><label>Pupil<select id="ip">${P.map(p=>`<option value="${p.id}">${p.name}, ${p.gr}</option>`).join('')}</select></label>
    <div class="row2"><label>How did this come to us?<select id="is">${opt(INSRC)}</select></label><label>Urgency<select id="iu">${opt(['Normal','Urgent'])}</select></label></div>
    <div class="row2"><label>Concern<select id="ic">${opt(CONCERNS)}</select></label><label>Type of bullying<select id="ib"><option value="">Not applicable</option>${BTYPES.map(b=>`<option>${b}</option>`).join('')}</select></label></div>
    <label>What the pupil shared<textarea id="id1" rows="3"></textarea></label><label>Home and background<textarea id="ibg" rows="2"></textarea></label><label>Plan and next step<textarea id="ipl" rows="2"></textarea></label>
    <label>Parent informed?<select id="iin">${opt(['Not yet','Yes, by call slip','Yes, in person'])}</select></label><div class="row2"><button class="btn y">Save intake</button>${X}</div></form>`;
  if(m==='resume')h=`<h3>Continue my chat</h3><form onsubmit="doResume(event)"><label>Your code<input id="rc2" placeholder="K-8392" autocapitalize="characters"></label><label>Your 4-digit PIN<input id="rpn" type="password" inputmode="numeric" maxlength="4"></label><p id="re" role="alert" class="err"></p><div class="row2"><button class="btn y">Open chat</button>${X}</div></form>`;
  if(m==='addp')h=`<h3>Add a learner</h3><form onsubmit="doAdd(event)"><label>Full name<input id="an"></label><label>LRN (12 digits)<input id="al2" inputmode="numeric" maxlength="12"></label><div class="row2"><label>Grade<select id="ag">${[1,2,3,4,5,6].map(g=>`<option>${g}</option>`).join('')}</select></label><label>Section<input id="as"></label></div><div class="row2"><button class="btn y">Add learner</button>${X}</div></form>`;
  if(m&&m.startsWith('gen_')){
    const fid=m.replace('gen_','');
    isWide=true;
    h=renderGenFormModal(fid);
  }
  if(m&&m.startsWith('newstaff'))h=`<h3>Add School Personnel Account</h3><p class="mute">Directly create an authorized account for a guidance counselor or teacher.</p><form onsubmit="doAddStaff(event)"><label>Full name<input id="nst_name" placeholder="e.g. Teacher Maria Santos or Sir Ramos" required></label><div class="row2"><label>Role / Position<select id="nst_role" onchange="const b=$('nst_sec_wrap');if(b)b.style.display=this.value=='teacher'?'block':'none'"><option value="guidance">Guidance Personnel</option><option value="teacher">Teacher</option></select></label><label>Username / Employee ID<input id="nst_u" placeholder="e.g. jramos" required></label></div><div class="row2"><label>Email<input id="nst_em" type="email" placeholder="name@school.edu.ph" required></label><label>Initial password<input id="nst_pw" type="password" value="demo123" required></label></div><div id="nst_sec_wrap" style="display:none"><label>Advisory section (for Teachers)<select id="nst_sec"><option value="">All sections / Subject teacher</option>${['Sampaguita','Narra','Mabini','Rosal','Rizal','Luna','Dahlia','Molave','Bonifacio'].map(s=>`<option value="${s}">${s} (${(P.find(p=>sec(p)==s)||{gr:''}).gr})</option>`).join('')}</select></label></div><p id="nst_err" class="err" role="alert"></p><div class="row2"><button class="btn y">Create active account</button>${X}</div></form>`;
  $('modal').innerHTML=h?`<div class="ov" onclick="if(event.target===this){S.modal=null;render()}"><div class="dlg ${isWide?'wide':''}" role="dialog" aria-modal="true">${h}</div></div>`:'';const f=$('modal').querySelector('input,select,textarea');if(f)f.focus()}
  function printQr(){document.body.classList.add('pq');window.print();setTimeout(()=>document.body.classList.remove('pq'),600)}
  function doIntake(e){e.preventDefault();const t=$('id1').value.trim();if(!t)return toast('Write what the pupil shared.');const bg=$('ibg').value.trim(),pl=$('ipl').value.trim(),inf=$('iin').value,c=$('ic').value;
  S.cases.unshift({id:++S.seq,p:+$('ip').value,c,bt:c=='Bullying'?$('ib').value:'',u:$('iu').value,st:'Ongoing',by:'Guidance intake ('+$('is').value+')',d:iso(0),desc:t,notes:[{d:iso(0),t:'Intake interview done.'+(pl?' Plan: '+pl:'')}],intake:{src:$('is').value,bg,plan:pl,informed:inf}});S.sel=S.seq;S.modal=null;save();toast('Intake saved as a new case.');go('cases')}
  function doRs(e,id){e.preventDefault();const a=S.appts.find(x=>x.id==id),d=$('rd2').value,w=$('rw').value.trim();const er=okDate(d,a.id,$('rt').value);if(er)return toast(er);if(!w)return toast('Add a reason.');a.st='Reschedule requested';a.rq={d,t:$('rt').value,why:w};const p=pp(apP(a)),pa=parentOf(p.id);notify(p.id,`San Roque ES Guidance: We received your request to move the conference for ${p.name} to ${fmt(d)} at ${$('rt').value}. The Guidance Office will reply soon.`);S.flash='Your request to move the conference was sent. A message went to you by '+chDesc(pa)+'.';S.modal=null;save();render()}
  function doId(e){e.preventDefault();const n=$('in').value.trim(),l=dig($('il').value);if(!n||l.length!==12)return toast('Enter your full name and your 12-digit LRN.');
  const c=S.chats.find(x=>x.id==S.chat),m=P.find(p=>p.lrn===l);c.anon=false;c.alias=n;c.pid=m?m.id:0;c.msgs.push({s:'p',t:`I want to share my name: ${n}, LRN ${l}, ${$('ig').value}, adviser ${$('ia').value.trim()||'not given'}.`,tm:now()});S.modal=null;save();toast('Shared with the counselor.');render()}
  function doResume(e){e.preventDefault();const code=$('rc2').value.trim().toUpperCase(),pin=$('rpn').value.trim(),c=S.chats.find(x=>x.code===code&&x.pin===pin);
  if(!c)return $('re').textContent='That code and PIN do not match. Check both and try again.';if(!live(c))return $('re').textContent='This chat closed after 7 days. Start a new one.';
  S.chat=c.id;S.modal=null;toast('Welcome back.');render()}
  function doAdd(e){e.preventDefault();const n=$('an').value.trim(),l=dig($('al2').value),s=$('as').value.trim();if(!n||!s||l.length!==12)return toast('Enter a name, a section, and a 12-digit LRN.');if(P.some(p=>p.lrn==l))return toast('That LRN is already on the list.');
  P.push({id:Math.max(...P.map(p=>p.id))+1,lrn:l,name:n,gr:'Grade '+$('ag').value+' – '+s});S.modal=null;save();toast(n+' added.');render()}
  function doAddStaff(e){e.preventDefault();const g=i=>$(i)?$(i).value.trim():'',name=g('nst_name'),role=g('nst_role'),u=g('nst_u').toLowerCase(),em=g('nst_em').toLowerCase(),pw=g('nst_pw'),section=$('nst_sec')?$('nst_sec').value:'',E=m=>$('nst_err').textContent=m;
  if(!name)return E('Enter full name.');if(!u)return E('Enter username or Employee ID.');if(!/^[a-zA-Z0-9._-]+$/.test(u))return E('Username may only contain letters, numbers, dots, and hyphens.');if(!/^\S+@\S+\.\S+$/.test(em))return E('Enter a valid email.');if(pw.length<6)return E('Password needs at least 6 characters.');if((S.staff||[]).some(x=>x.u.toLowerCase()==u||(x.em&&x.em.toLowerCase()==em)))return E('That username or email is already registered.');
  const st={u,pw,role,name,em,section:role=='teacher'?section:'',status:'Active',isSuper:false,d:iso(0)};(S.staff=S.staff||[]).push(st);if(role=='teacher'&&section)ADV[section]=name;S.modal=null;save();toast('Created active account for '+name+'.');render()}
  function vStaff(){
    const pending=pendingStaff(),active=(S.staff||[]).filter(s=>s.status!=='Pending');
    return `<div class="top"><div><h2>School Personnel & Account Control</h2><p class="lede">Super Admin Command Center: Review access requests, authorize guidance personnel and teachers, and manage staff permissions under DepEd Child Protection Policy (DO 40, s. 2012).</p></div><button class="btn y" style="margin:0 0 20px" onclick="S.modal='newstaff';render()">+ Add personnel account</button></div>
    <div class="cols a"><div class="blk"><h3>Super Admin Control</h3><p class="mute">Under the Data Privacy Act (RA 10173), student counseling files are confidential. School staff must be authorized before accessing student records or intervention tracking.</p>
    <div class="note" style="margin-top:14px"><b>Direct Personnel Provisioning:</b><br><small class="mute">Teachers and Guidance staff do not register on the public sign-up page. Use the <b>+ Add personnel account</b> button above to create and authorize active accounts directly.</small></div>
    <div class="note" style="margin-top:10px"><b>Designated Super Admin:</b><br><span>${esc((S.staff.find(s=>s.isSuper)||{}).name||'Ma’am De Ocampo (Guidance Lead)')}</span><br><small class="mute">Holds primary administrative oversight over all accounts.</small></div></div>
    <div>
    ${pending.length?`<div class="blk r" style="margin-bottom:24px"><div class="item" style="padding-top:0"><h3 style="margin:0;color:var(--danger)">Pending access requests (${pending.length})</h3><span class="tag bad">Action required</span></div>
    <p class="mute">The following school personnel have registered and are waiting for Super Admin authorization to sign in.</p>
    ${pending.map(st=>`<div class="item"><div><b>${esc(st.name)}</b> <span class="tag ${st.role=='guidance'?'bad':'warn'}">${st.role=='guidance'?'Guidance Personnel':'Teacher'}</span>${st.section?`<span class="tag good">Advisory: ${esc(st.section)}</span>`:''}<br><span class="mute">Username: <b>${esc(st.u)}</b> · Email: ${esc(st.em||'None')} · Requested ${fmt(st.d||iso(0))}</span></div>
    <div class="row2"><button class="btn s" onclick="apprStaff('${st.u}',true)">Approve access</button><button class="btn s o" onclick="apprStaff('${st.u}',false)">Decline</button></div></div>`).join('')}</div>`:''}
    <div class="blk"><div class="item" style="padding-top:0"><h3 style="margin:0">Active School Personnel Directory (${active.filter(s=>s.status==='Active').length})</h3></div>
    ${active.map(st=>`<div class="item"><div><b>${esc(st.name)}</b> ${st.isSuper?`<span class="tag good" style="background:var(--primary);color:#fff">Super Admin</span>`:`<span class="tag ${st.role=='guidance'?'bad':'warn'}">${st.role=='guidance'?'Guidance Personnel':'Teacher'}</span>`} <span class="tag ${st.status==='Active'?'good':st.status==='Declined'?'bad':'warn'}">${st.status}</span>${st.section?`<span class="mute"> · Advisory: <b>${esc(st.section)}</b></span>`:''}<br><span class="mute">Username: <code>${esc(st.u)}</code> · Email: ${esc(st.em||'None')}</span></div>
    ${!st.isSuper?`<div class="row2"><button class="btn s o" onclick="toggleStaffStatus('${st.u}')">${st.status==='Active'?'Suspend':'Activate'}</button><button class="btn s o" style="color:var(--danger);border-color:var(--danger)" onclick="delStaff('${st.u}')">Remove</button></div>`:'<span class="mute" style="font-weight:600">Master Super Admin</span>'}</div>`).join('')}</div></div></div>`}
  /* ---- guidance forms & document generator ---- */
  const GUIDANCE_FORMS = [
    {
      id: 'anecdotal',
      code: 'DEPED-SRES-AR',
      title: 'ANECDOTAL RECORD',
      category: 'Behavioral Records',
      badge: 'Official DepEd Form',
      desc: 'Official observation log to document specific learner behavioral incidents, setting, observer notes, and disciplinary or supportive actions taken by teachers or guidance designates.'
    },
    {
      id: 'annex-a',
      code: 'ANNEX A',
      title: 'Statement of Confidentiality',
      category: 'Annexes',
      badge: 'Legal & Consent',
      desc: 'Counseling confidentiality agreement, statutory limitations (harm to self/others, abuse/neglect of minor, court subpoena), client rights, responsibilities, and parent/guardian signed agreement per DepEd DO 40 s. 2012 & RA 10173.'
    },
    {
      id: 'annex-b',
      code: 'ANNEX B',
      title: 'INTAKE INTERVIEW FORM',
      category: 'Annexes',
      badge: 'Assessment & Clinical',
      desc: 'Primary 17-point intake interview covering current situation, severity, duration, root causes, coping attempts, readiness for change, and counselor’s clinical assessment.'
    },
    {
      id: 'annex-c',
      code: 'ANNEX C',
      title: 'COUNSELING PLAN',
      category: 'Annexes',
      badge: 'Intervention Strategy',
      desc: 'Structured case plan outlining individualized overall counseling goals, multi-session milestones, specific behavioral targets, and designated guidance interventions.'
    },
    {
      id: 'annex-d',
      code: 'ANNEX D',
      title: 'CASE NOTES TEMPLATE',
      category: 'Annexes',
      badge: 'Session Tracking',
      desc: 'Session-by-session clinical progress documentation across 9 structured dimensions: topics discussed, plan relevance, interventions applied, observations, progress, and homework.'
    }
  ];

  S.arRows = S.arRows || [
    {dt: iso(0)+' 09:30 AM', place: 'Classroom', obs: 'Teacher Cruz', beh: 'Engaged in verbal disagreement with seatmate during group seatwork.', handle: 'Separated pupils temporarily, facilitated calm dialogue, and referred to guidance.'},
    {dt: '', place: '', obs: '', beh: '', handle: ''},
    {dt: '', place: '', obs: '', beh: '', handle: ''}
  ];

  S.cpRows = S.cpRows || [
    {sess: 'Session 1 – '+iso(1), goal: 'Establish rapport, explore triggers, and define personal goals', intervention: 'Individual intake counseling & active listening'},
    {sess: 'Session 2 – '+iso(8), goal: 'Develop emotional regulation and constructive conflict resolution skills', intervention: 'Behavioral role-playing & emotion journal'},
    {sess: 'Session 3 – '+iso(15), goal: 'Assess peer interaction progress and review homework results', intervention: 'Follow-up evaluation & adviser feedback'}
  ];

  function openGenModal(fid){
    S.modal = 'gen_' + fid;
    render();
  }

  function fillKidForForm(fid, kidId){
    if(!kidId) return;
    const k = pp(+kidId);
    if(!k) return;
    const parts = (k.gr||'').split(' – ');
    const gr = parts[0] || '';
    const secName = parts[1] || '';
    const pa = parentOf(k.id);

    if(fid === 'anecdotal'){
      if($('gf_ar_name')) $('gf_ar_name').value = k.name;
      if($('gf_ar_grade')) $('gf_ar_grade').value = gr;
      if($('gf_ar_sec')) $('gf_ar_sec').value = secName;
      if($('gf_ar_school')) $('gf_ar_school').value = 'San Roque Elementary School';
    } else if(fid === 'annex-a'){
      if($('gf_aa_name')) $('gf_aa_name').value = k.name;
      if($('gf_aa_gr')) $('gf_aa_gr').value = k.gr;
      if($('gf_aa_parent')) $('gf_aa_parent').value = pa ? pa.name : '';
      if($('gf_aa_school')) $('gf_aa_school').value = 'San Roque Elementary School';
    } else if(fid === 'annex-b'){
      if($('gf_ab_name')) $('gf_ab_name').value = k.name;
      if($('gf_ab_gr')) $('gf_ab_gr').value = gr;
      if($('gf_ab_sec')) $('gf_ab_sec').value = secName;
      if($('gf_ab_date')) $('gf_ab_date').value = iso(0);
    } else if(fid === 'annex-c'){
      if($('gf_ac_name')) $('gf_ac_name').value = k.name;
      if($('gf_ac_gr')) $('gf_ac_gr').value = k.gr;
    } else if(fid === 'annex-d'){
      if($('gf_ad_name')) $('gf_ad_name').value = k.name;
      if($('gf_ad_gr')) $('gf_ad_gr').value = k.gr;
      if($('gf_ad_date')) $('gf_ad_date').value = iso(0);
    }
    toast('Auto-filled learner details for ' + k.name + '.');
  }

  function renderArRows(){
    return (S.arRows||[]).map((r,i)=>`
      <tr>
        <td><input value="${esc(r.dt||'')}" id="ar_dt_${i}" placeholder="Date / Time"></td>
        <td><input value="${esc(r.place||'')}" id="ar_pl_${i}" placeholder="Place"></td>
        <td><input value="${esc(r.obs||'')}" id="ar_ob_${i}" placeholder="Observer"></td>
        <td><textarea id="ar_beh_${i}" placeholder="Behavior observed">${esc(r.beh||'')}</textarea></td>
        <td><textarea id="ar_hdl_${i}" placeholder="How handled">${esc(r.handle||'')}</textarea></td>
        <td style="text-align:center"><button type="button" class="btn s o" style="color:var(--danger);padding:4px 8px" onclick="delArRow(${i})">✕</button></td>
      </tr>
    `).join('');
  }

  function syncArRowsFromDOM(){
    S.arRows = (S.arRows||[]).map((r,i)=>({
      dt: $('ar_dt_'+i)?$('ar_dt_'+i).value.trim():r.dt,
      place: $('ar_pl_'+i)?$('ar_pl_'+i).value.trim():r.place,
      obs: $('ar_ob_'+i)?$('ar_ob_'+i).value.trim():r.obs,
      beh: $('ar_beh_'+i)?$('ar_beh_'+i).value.trim():r.beh,
      handle: $('ar_hdl_'+i)?$('ar_hdl_'+i).value.trim():r.handle
    }));
  }

  function addArRow(){
    syncArRowsFromDOM();
    S.arRows.push({dt: iso(0)+' '+now(), place: 'Classroom', obs: S.user?S.user.name:'Guidance Counselor', beh: '', handle: ''});
    const tb = $('ar_rows_tbody');
    if(tb) tb.innerHTML = renderArRows();
  }

  function delArRow(i){
    syncArRowsFromDOM();
    if(S.arRows.length <= 1) return toast('At least one row is required.');
    S.arRows.splice(i,1);
    const tb = $('ar_rows_tbody');
    if(tb) tb.innerHTML = renderArRows();
  }

  function renderCpRows(){
    return (S.cpRows||[]).map((r,i)=>`
      <tr>
        <td><input value="${esc(r.sess||'')}" id="cp_sess_${i}" placeholder="Session # & Date"></td>
        <td><textarea id="cp_goal_${i}" placeholder="Specific Goal">${esc(r.goal||'')}</textarea></td>
        <td><textarea id="cp_int_${i}" placeholder="Intervention">${esc(r.intervention||'')}</textarea></td>
        <td style="text-align:center"><button type="button" class="btn s o" style="color:var(--danger);padding:4px 8px" onclick="delCpRow(${i})">✕</button></td>
      </tr>
    `).join('');
  }

  function syncCpRowsFromDOM(){
    S.cpRows = (S.cpRows||[]).map((r,i)=>({
      sess: $('cp_sess_'+i)?$('cp_sess_'+i).value.trim():r.sess,
      goal: $('cp_goal_'+i)?$('cp_goal_'+i).value.trim():r.goal,
      intervention: $('cp_int_'+i)?$('cp_int_'+i).value.trim():r.intervention
    }));
  }

  function addCpRow(){
    syncCpRowsFromDOM();
    const nextIdx = (S.cpRows.length + 1);
    S.cpRows.push({sess: 'Session ' + nextIdx + ' – ' + iso(nextIdx * 7), goal: '', intervention: ''});
    const tb = $('cp_rows_tbody');
    if(tb) tb.innerHTML = renderCpRows();
  }

  function delCpRow(i){
    syncCpRowsFromDOM();
    if(S.cpRows.length <= 1) return toast('At least one row is required.');
    S.cpRows.splice(i,1);
    const tb = $('cp_rows_tbody');
    if(tb) tb.innerHTML = renderCpRows();
  }

  function renderGenFormModal(fid){
    const f = GUIDANCE_FORMS.find(x=>x.id===fid) || GUIDANCE_FORMS[0];
    const defPrep = (S.user && S.user.name) ? S.user.name : 'Ma’am De Ocampo (Guidance Lead)';

    let fieldsHtml = '';
    if(fid === 'anecdotal'){
      fieldsHtml = `
        <div class="row2">
          <label>Name of Learner Observed<input id="gf_ar_name" placeholder="Full name of learner" required></label>
          <label>Name of School<input id="gf_ar_school" value="San Roque Elementary School"></label>
        </div>
        <div class="row2">
          <label>Grade / Year Level<input id="gf_ar_grade" placeholder="e.g. Grade 4"></label>
          <label>Section<input id="gf_ar_sec" placeholder="e.g. Narra"></label>
        </div>
        <div class="form-field-group">
          <h4>Behavioral Observation Records</h4>
          <table class="tbl-form">
            <thead>
              <tr>
                <th style="width:18%">Date/ Time</th>
                <th style="width:16%">Place</th>
                <th style="width:18%">Observer</th>
                <th style="width:24%">Behavior Observed</th>
                <th style="width:20%">How Handled</th>
                <th style="width:40px">Del</th>
              </tr>
            </thead>
            <tbody id="ar_rows_tbody">${renderArRows()}</tbody>
          </table>
          <button type="button" class="btn s o" onclick="addArRow()">+ Add Observation Row</button>
        </div>
        <label>Summary<textarea id="gf_ar_summary" rows="3" placeholder="Summary of behavioral patterns and follow-up guidance recommendations..."></textarea></label>
        <label>Prepared by (Name over printed signature / School Guidance Designate)
          <input id="gf_ar_prep" value="${esc(defPrep)} / School Guidance Designate">
        </label>
      `;
    } else if(fid === 'annex-a'){
      fieldsHtml = `
        <div class="row2">
          <label>Name of Learner / Counselee<input id="gf_aa_name" placeholder="Full name of learner" required></label>
          <label>Grade Level & Section<input id="gf_aa_gr" placeholder="e.g. Grade 3 – Sampaguita"></label>
        </div>
        <div class="row2">
          <label>Parent / Guardian’s Name<input id="gf_aa_parent" placeholder="Parent’s full name"></label>
          <label>Date and Time<input id="gf_aa_dt" value="${iso(0)} ${now()}"></label>
        </div>
        <div class="row2">
          <label>Guidance Counselor / Designate<input id="gf_aa_counselor" value="${esc(defPrep)}"></label>
          <label>School Name<input id="gf_aa_school" value="San Roque Elementary School"></label>
        </div>
        <div class="note" style="margin:14px 0;background:#fff;border:1px solid var(--line);border-left:4px solid var(--primary)">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.4"><b>Statutory Confidentiality Limitations:</b> The counseling services of the Guidance and Counseling Office cater to the mental health and well-being of all learners. All discussions are confidential except: (1) imminent danger of suicide or harm to others, (2) reasonable suspicion of emotional/physical/sexual abuse or neglect of a minor, or (3) court subpoena.</p>
          <label style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:13px;margin:8px 0 0">
            <input type="checkbox" id="gf_aa_agree" checked style="width:auto;min-height:0;margin:0">
            Parent/Client acknowledgment: "By signing this, I have read, understood and agreed to the provisions of this Statement of Confidentiality of the Guidance and Counseling Office."
          </label>
        </div>
      `;
    } else if(fid === 'annex-b'){
      fieldsHtml = `
        <div class="row2">
          <label>Learner Full Name<input id="gf_ab_name" placeholder="Full name" required></label>
          <label>Date<input id="gf_ab_date" type="date" value="${iso(0)}"></label>
        </div>
        <div class="row2">
          <label>Birth Date<input id="gf_ab_bdate" type="date" value="2015-05-12"></label>
          <label>Sex<select id="gf_ab_sex"><option>Male</option><option>Female</option></select></label>
          <label>Preferred Language<input id="gf_ab_lang" value="Filipino / English"></label>
        </div>
        <div class="row2">
          <label>Grade Level<input id="gf_ab_gr" placeholder="Grade 4"></label>
          <label>Section<input id="gf_ab_sec" placeholder="Narra"></label>
        </div>
        <p class="mute" style="margin:10px 0 16px;font-style:italic">"We are concerned about how things are going for you. Our session today will help us discuss what’s going O.K. and what’s not going so well. Everything is confidential except for those that need to be discussed with others in order to HELP you."</p>

        <div class="form-field-group">
          <h4>Learner Diagnostic Questions</h4>
          <label>1. How would you describe your current situation? What problems are you experiencing? What are your main concerns?
            <textarea id="gf_ab_q1" rows="2" placeholder="Learner's description of current situation..."></textarea>
          </label>

          <label>2. How serious are these matters for you at this time?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q2" value="Very Serious"> Very Serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Serious" checked> Serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Not too serious"> Not too serious</label>
            <label><input type="radio" name="gf_ab_q2" value="Not serious at all"> Not serious at all</label>
          </div>

          <label>3. How long have you had these problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q3" value="0-3 months" checked> 0-3 months</label>
            <label><input type="radio" name="gf_ab_q3" value="4 months to a year"> 4 months to a year</label>
            <label><input type="radio" name="gf_ab_q3" value="more than a year"> more than a year</label>
          </div>

          <div class="row2">
            <label>4. What caused these problems?<textarea id="gf_ab_q4" rows="2"></textarea></label>
            <label>5. Do others (parents, guardians, friends) think there were other causes? What do they say?<textarea id="gf_ab_q5" rows="2"></textarea></label>
          </div>

          <label>6. What other things are currently making it hard to deal with the problems?<textarea id="gf_ab_q6" rows="2"></textarea></label>
          
          <div class="row2">
            <label>7. What have you already tried in order to deal with the problems?<textarea id="gf_ab_q7" rows="2"></textarea></label>
            <label>8. Why do you think these things didn’t work?<textarea id="gf_ab_q8" rows="2"></textarea></label>
          </div>

          <div class="row2">
            <label>9. What have others advised you to do?<textarea id="gf_ab_q9" rows="2"></textarea></label>
            <label>10. What do you think would help to solve the problem?<textarea id="gf_ab_q10" rows="2"></textarea></label>
          </div>

          <label>11. How much time and effort do you want to put into solving the problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q11" value="none at all"> none at all</label>
            <label><input type="radio" name="gf_ab_q11" value="only a little"> only a little</label>
            <label><input type="radio" name="gf_ab_q11" value="just enough" checked> just enough</label>
            <label><input type="radio" name="gf_ab_q11" value="very much"> very much</label>
          </div>

          <label>12. If you answered 1st, 2nd, or 3rd option, why don’t you want to put more time and effort into solving the problems?<textarea id="gf_ab_q12" rows="2"></textarea></label>

          <div class="row2">
            <label>13. What type of help do you want?<textarea id="gf_ab_q13" rows="2"></textarea></label>
            <label>14. What changes are you hoping for?<textarea id="gf_ab_q14" rows="2"></textarea></label>
          </div>

          <label>15. How hopeful are you about solving the problems?</label>
          <div class="form-radio-grid">
            <label><input type="radio" name="gf_ab_q15" value="very hopeful"> very hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="hopeful" checked> hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="somewhat hopeful"> somewhat hopeful</label>
            <label><input type="radio" name="gf_ab_q15" value="hopeless"> hopeless</label>
          </div>

          <div class="row2">
            <label>16. If you are hopeless, why?<textarea id="gf_ab_q16" rows="2"></textarea></label>
            <label>17. What else should we know so that we can help? Any other matters?<textarea id="gf_ab_q17" rows="2"></textarea></label>
          </div>
        </div>

        <div class="form-field-group" style="background:var(--bg);padding:14px;border-radius:8px;border:1px dashed var(--line);margin-top:16px">
          <h4>For Interviewer / Counselor Only (Confidential)</h4>
          <div class="row2">
            <label>Name of Interviewer / Counselor<input id="gf_ab_int_name" value="${esc(defPrep)}"></label>
            <label>Date of Intake<input id="gf_ab_int_date" type="date" value="${iso(0)}"></label>
          </div>
          <div class="row2">
            <label>Note the identified problem<input id="gf_ab_int_prob" placeholder="e.g. Peer conflict, Bullying incident, Academic stress"></label>
            <label>Is the counselee seeking help?<select id="gf_ab_int_seek"><option value="Yes">Yes</option><option value="No">No</option></select></label>
          </div>
          <label>If not, what are the circumstances that brought the counselee to the interview?<textarea id="gf_ab_int_circ" rows="2" placeholder="e.g. Teacher referral due to hallway incident."></textarea></label>
          <label>Counselor’s Clinical Notes<textarea id="gf_ab_int_notes" rows="3" placeholder="Counselor observations, clinical assessment, initial recommendations..."></textarea></label>
        </div>
      `;
    } else if(fid === 'annex-c'){
      fieldsHtml = `
        <div class="row2">
          <label>Name of Counselee<input id="gf_ac_name" placeholder="Full name of counselee" required></label>
          <label>Grade Level & Section<input id="gf_ac_gr" placeholder="e.g. Grade 5 – Rizal"></label>
        </div>
        <div class="form-field-group">
          <h4>Overall Goals (case to case basis)</h4>
          <label>1. Goal 1<input id="gf_ac_g1" value="Improve emotional regulation and de-escalation in social situations."></label>
          <label>2. Goal 2<input id="gf_ac_g2" value="Foster positive peer communication and classroom engagement."></label>
          <label>3. Goal 3<input id="gf_ac_g3" value="Coordinate with adviser and parents for consistent support at home."></label>
        </div>
        <div class="form-field-group">
          <h4>Planned Counseling Sessions & Interventions</h4>
          <table class="tbl-form">
            <thead>
              <tr>
                <th style="width:28%">Session # & Date</th>
                <th style="width:34%">Specific Goal</th>
                <th style="width:34%">Intervention</th>
                <th style="width:40px">Del</th>
              </tr>
            </thead>
            <tbody id="cp_rows_tbody">${renderCpRows()}</tbody>
          </table>
          <button type="button" class="btn s o" onclick="addCpRow()">+ Add Session Row</button>
        </div>
        <label>Prepared by (Signature over printed name of Guidance Counselor)
          <input id="gf_ac_prep" value="${esc(defPrep)}">
        </label>
      `;
    } else if(fid === 'annex-d'){
      fieldsHtml = `
        <div class="row2">
          <label>Name of Counselee<input id="gf_ad_name" placeholder="Full name of counselee" required></label>
          <label>Session No.<input id="gf_ad_sess" value="1" style="max-width:120px"></label>
          <label>Date<input id="gf_ad_date" type="date" value="${iso(0)}"></label>
        </div>
        <label>Grade Level & Section<input id="gf_ad_gr" placeholder="e.g. Grade 4 – Narra"></label>
        
        <div class="form-field-group">
          <h4>Case Progress & Clinical Observations (9 Dimensions)</h4>
          <label>1. Topics discussed during the session<textarea id="gf_ad_d1" rows="2" placeholder="Discussion topics..."></textarea></label>
          <label>2. Relevance of the session to the counseling plan<textarea id="gf_ad_d2" rows="2" placeholder="Direct alignment with Goal 1..."></textarea></label>
          <label>3. Means of achieving the counseling plan goals and objectives<textarea id="gf_ad_d3" rows="2" placeholder="Techniques, roleplay, guided reflection..."></textarea></label>
          <label>4. Interventions and techniques used during the session and their effectiveness<textarea id="gf_ad_d4" rows="2" placeholder="Interventions used and observed impact..."></textarea></label>
          <label>5. Counseling observations<textarea id="gf_ad_d5" rows="2" placeholder="Non-verbal cues, mood, responsiveness..."></textarea></label>
          <label>6. Progress or setbacks<textarea id="gf_ad_d6" rows="2" placeholder="Observed gains or challenges..."></textarea></label>
          <label>7. Signs, symptoms, and any increase or decrease in the severity of behaviors as they relate to the main concern<textarea id="gf_ad_d7" rows="2" placeholder="Behavioral changes noted..."></textarea></label>
          <label>8. Homework assigned, results, and compliance (if any)<textarea id="gf_ad_d8" rows="2" placeholder="Home reflection or behavior chart assigned..."></textarea></label>
          <label>9. The counselee’s current strengths and challenges<textarea id="gf_ad_d9" rows="2" placeholder="Strengths identified and ongoing areas for support..."></textarea></label>
        </div>

        <label>Prepared by (Guidance Counselor Signature line)
          <input id="gf_ad_prep" value="${esc(defPrep)}">
        </label>
      `;
    }

    return `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div>
          <span class="tag good" style="background:var(--primary);color:#fff">${f.code}</span>
          <h3 style="margin:4px 0 2px">${f.title}</h3>
          <p class="mute" style="margin:0">${f.desc}</p>
        </div>
      </div>
      
      <div class="note" style="margin-bottom:16px">
        <b>Quick Learner Auto-Fill (Optional):</b>
        <select onchange="fillKidForForm('${f.id}', this.value)" style="margin-top:4px">
          <option value="">-- Choose enrolled learner to auto-fill details --</option>
          ${P.map(p=>`<option value="${p.id}">${p.name} (${p.gr})</option>`).join('')}
        </select>
      </div>

      <form onsubmit="event.preventDefault()">
        ${fieldsHtml}
        <div class="row2" style="margin-top:24px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:16px">
          <button type="button" class="btn y" onclick="submitGenForm('${f.id}', 'print')">📄 Generate & Download (PDF / Print)</button>
          <button type="button" class="btn o" onclick="submitGenForm('${f.id}', 'doc')">⬇ Download File (.DOC)</button>
          <button type="button" class="btn o" onclick="submitGenForm('${f.id}', 'vault')">📁 Save to Calamity Vault</button>
          <button type="button" class="btn o" onclick="S.modal=null;render()">Cancel</button>
        </div>
      </form>
    `;
  }

  function getRadioVal(name, fallback){
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : (fallback || '');
  }

  function generateFormHtml(fid, isBlank, d){
    d = d || {};
    const headerHtml = `
      <div class="deped-hdr">
        <div class="rep">Republic of the Philippines</div>
        <div class="dept">Department of Education</div>
        <div class="divn">Region IV-A CALABARZON · Division of Rizal</div>
        <div class="sch">${esc(d.school || 'SAN ROQUE ELEMENTARY SCHOOL')}</div>
        <div class="off">Guidance and Counseling Office</div>
      </div>
    `;

    if(fid === 'anecdotal'){
      const rows = isBlank ? [{}, {}, {}, {}, {}] : (d.rows || S.arRows || []);
      return `
        ${headerHtml}
        <div class="form-title">ANECDOTAL RECORD</div>
        <div class="meta-line">
          <span><b>Name of Learner Observed:</b> <span class="val-line" style="min-width:320px">${esc(d.name || '')}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade / Year Level:</b> <span class="val-line" style="min-width:140px">${esc(d.grade || '')}</span></span>
          <span><b>Section:</b> <span class="val-line" style="min-width:140px">${esc(d.section || '')}</span></span>
          <span><b>Name of School:</b> <span class="val-line" style="min-width:220px">${esc(d.school || 'San Roque Elementary School')}</span></span>
        </div>
        <table class="tbl-print">
          <thead>
            <tr>
              <th style="width:18%">Date/ Time</th>
              <th style="width:16%">Place</th>
              <th style="width:18%">Observer</th>
              <th style="width:24%">Behavior Observed</th>
              <th style="width:24%">How Handled</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`
              <tr>
                <td>${esc(r.dt || '')}</td>
                <td>${esc(r.place || '')}</td>
                <td>${esc(r.obs || '')}</td>
                <td>${esc(r.beh || '')}</td>
                <td>${esc(r.handle || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top:16px">
          <b>Summary:</b>
          <div style="border-bottom:1px solid #000;min-height:48px;padding-top:4px;line-height:1.6">${esc(d.summary || '')}</div>
        </div>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || 'School Guidance Designate')}</div>
            <div class="sig-sub">Name over printed signature / School Guidance Designate</div>
          </div>
        </div>
      `;
    } else if(fid === 'annex-a'){
      return `
        ${headerHtml}
        <div class="form-title">ANNEX A</div>
        <div class="form-subtitle">Statement of Confidentiality</div>
        <div class="meta-line" style="margin-bottom:14px">
          <span><b>Learner:</b> <span class="val-line" style="min-width:240px">${esc(d.name || '')}</span></span>
          <span><b>Grade & Section:</b> <span class="val-line" style="min-width:180px">${esc(d.gr || '')}</span></span>
        </div>
        <p style="text-align:justify;font-size:10pt">Counseling services cater to the mental health and well-being of all learners. The Guidance and Counseling Office recognizes that people are faced with various life stressors that can interfere with their daily behavior and functions. Counseling services are completely confidential.</p>
        <p style="text-align:justify;font-size:10pt">There are a few exceptions or limitations to confidentiality in counseling situations. The following are the conditions to be considered in breaking the confidentiality in counseling:</p>
        <ul style="font-size:10pt;line-height:1.4">
          <li>If you are becoming an imminent danger to yourself and/or to others through thoughts of suicide or threats to harm other people</li>
          <li>If there is a reasonable suspicion of emotional and/or physical neglect or abuse including sexual abuse of a minor.</li>
          <li>In rare cases, courts will be asking guidance counselors to testify about you.</li>
        </ul>
        <div class="box-note">
          <b>Confidentiality Guidelines:</b> Many people are concerned about the confidentiality of meeting with a counselor. The following are kept confidential: (1) that you are seeing a counselor; (2) all contact information, including your counseling schedules; and (3) the guidance counselor being the only person who has access to the information discussed, unless you give written permission for specific information to be shared.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:9.5pt;margin:12px 0">
          <div style="border:1px solid #ccc;padding:8px">
            <b>Rights of Client:</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li>Be treated with respect and consideration</li>
              <li>Know that shared information is confidential</li>
              <li>Discuss dissatisfaction or concerns</li>
              <li>Refuse to complete consent forms requested</li>
              <li>Ask for referral to another counselor</li>
            </ul>
          </div>
          <div style="border:1px solid #ccc;padding:8px">
            <b>Responsibilities of Client:</b>
            <ul style="margin:4px 0 0;padding-left:18px">
              <li>Treat Guidance personnel with respect</li>
              <li>Maintain confidentiality of group members</li>
              <li>Help make counseling experience meaningful</li>
              <li>Notify immediately of service concerns</li>
            </ul>
          </div>
        </div>
        <p style="margin-top:14px;font-size:10pt;font-weight:bold">By signing this, I have read, understood and agreed to the provisions of this Statement of Confidentiality of the Guidance and Counseling Office.</p>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.parent || 'Parent / Guardian Signature')}</div>
            <div class="sig-sub">Parent’s Signature over printed name</div>
          </div>
          <div class="sig-box">
            <div class="sig-line">${esc(d.dt || iso(0)+' '+now())}</div>
            <div class="sig-sub">Date and Time</div>
          </div>
        </div>
      `;
    } else if(fid === 'annex-b'){
      return `
        ${headerHtml}
        <div class="form-title">ANNEX B</div>
        <div class="form-subtitle">INTAKE INTERVIEW FORM</div>
        <div class="meta-line">
          <span><b>Name:</b> <span class="val-line" style="min-width:280px">${esc(d.name || '')}</span></span>
          <span><b>Date:</b> <span class="val-line" style="min-width:140px">${esc(d.date || '')}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Birth Date:</b> <span class="val-line" style="min-width:110px">${esc(d.bdate || '')}</span></span>
          <span><b>Sex:</b> <span class="val-line" style="min-width:80px">${esc(d.sex || '')}</span></span>
          <span><b>Preferred Language:</b> <span class="val-line" style="min-width:140px">${esc(d.lang || '')}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade Level:</b> <span class="val-line" style="min-width:120px">${esc(d.grade || '')}</span></span>
          <span><b>Section:</b> <span class="val-line" style="min-width:140px">${esc(d.section || '')}</span></span>
        </div>
        <p style="font-size:9.5pt;font-style:italic;margin:10px 0;background:#f8fafc;border:1px solid #ddd;padding:6px 10px">We are concerned about how things are going for you. Our session today will help us discuss what’s going O.K. and what’s not going so well. Everything is confidential except for those that need to be discussed with others in order to HELP you.</p>

        <div class="q-row">
          <div class="q-prompt">How would you describe your current situation? What problems are you experiencing? What are your main concerns?</div>
          <div class="q-answer">${esc(d.q1 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How serious are these matters for you at this time?</div>
          <div class="q-answer">Selected: <b>${esc(d.q2 || '')}</b> (Very Serious / Serious / Not too serious / Not serious at all)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How long have you had these problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q3 || '')}</b> (0-3 months / 4 months to a year / more than a year)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What caused these problems?</div>
          <div class="q-answer">${esc(d.q4 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">Do others (parents, guardians, and friends) think there were other causes? If so, what do they say?</div>
          <div class="q-answer">${esc(d.q5 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What other things are currently making it hard to deal with the problems?</div>
          <div class="q-answer">${esc(d.q6 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What have you already tried in order to deal with the problems?</div>
          <div class="q-answer">${esc(d.q7 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">Why do you think these things didn’t work?</div>
          <div class="q-answer">${esc(d.q8 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What have others advised you to do?</div>
          <div class="q-answer">${esc(d.q9 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What do you think would help to solve the problem?</div>
          <div class="q-answer">${esc(d.q10 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How much time and effort do you want to put into solving the problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q11 || '')}</b> (none at all / only a little / just enough / very much)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">If you answered 1st, 2nd, or 3rd option, why don’t you want to put more time and effort into solving the problems?</div>
          <div class="q-answer">${esc(d.q12 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What type of help do you want?</div>
          <div class="q-answer">${esc(d.q13 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What changes are you hoping for?</div>
          <div class="q-answer">${esc(d.q14 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">How hopeful are you about solving the problems?</div>
          <div class="q-answer">Selected: <b>${esc(d.q15 || '')}</b> (very hopeful / hopeful / somewhat hopeful / hopeless)</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">If you are hopeless, why?</div>
          <div class="q-answer">${esc(d.q16 || '')}</div>
        </div>
        <div class="q-row">
          <div class="q-prompt">What else should we know so that we can help? Are there any other matters you want to discuss?</div>
          <div class="q-answer">${esc(d.q17 || '')}</div>
        </div>

        <div style="border-top:2px dashed #000;margin-top:24px;padding-top:12px;page-break-inside:avoid">
          <b style="font-size:10pt">For Interviewer/counselor only: Do not write anything below the line:</b>
          <div class="meta-line" style="margin-top:8px">
            <span><b>Name of Interviewer/Counselor:</b> <span class="val-line" style="min-width:220px">${esc(d.intName || '')}</span></span>
            <span><b>Date:</b> <span class="val-line" style="min-width:120px">${esc(d.intDate || '')}</span></span>
          </div>
          <div style="margin:8px 0">
            <b>Note the identified problem:</b>
            <div class="q-answer">${esc(d.intProb || '')}</div>
          </div>
          <div style="margin:8px 0">
            <b>Is the counselee seeking help?</b> [${d.intSeek==='Yes'?'X':' '}] Yes &nbsp;&nbsp; [${d.intSeek==='No'?'X':' '}] No
          </div>
          <div style="margin:8px 0">
            <b>If not, what are the circumstances that brought the counselee to the interview?</b>
            <div class="q-answer">${esc(d.intCirc || '')}</div>
          </div>
          <div style="margin:8px 0">
            <b>Counselor’s Notes:</b>
            <div style="border:1px solid #000;min-height:75px;padding:6px;font-size:9.5pt;line-height:1.4">${esc(d.intNotes || '')}</div>
          </div>
        </div>
      `;
    } else if(fid === 'annex-c'){
      const rows = isBlank ? [{}, {}, {}, {}, {}, {}, {}, {}, {}] : (d.rows || S.cpRows || []);
      return `
        ${headerHtml}
        <div class="form-title">ANNEX C</div>
        <div class="form-subtitle">COUNSELING PLAN</div>
        <div class="meta-line">
          <span><b>Name of Counselee:</b> <span class="val-line" style="min-width:280px">${esc(d.name || '')}</span></span>
          <span><b>Grade & Section:</b> <span class="val-line" style="min-width:180px">${esc(d.gr || '')}</span></span>
        </div>
        <div style="margin:12px 0 8px">
          <b>Overall Goals: (case to case basis)</b>
          <div style="margin:4px 0">1. <span class="val-line" style="min-width:90%">${esc(d.g1 || '')}</span></div>
          <div style="margin:4px 0">2. <span class="val-line" style="min-width:90%">${esc(d.g2 || '')}</span></div>
          <div style="margin:4px 0">3. <span class="val-line" style="min-width:90%">${esc(d.g3 || '')}</span></div>
        </div>
        <table class="tbl-print">
          <thead>
            <tr>
              <th style="width:28%">SESSION # & DATE</th>
              <th style="width:36%">SPECIFIC GOAL</th>
              <th style="width:36%">INTERVENTION</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`
              <tr>
                <td>${esc(r.sess || '')}</td>
                <td>${esc(r.goal || '')}</td>
                <td>${esc(r.intervention || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || 'Guidance Counselor')}</div>
            <div class="sig-sub">Signature over printed name of Guidance Counselor</div>
          </div>
        </div>
      `;
    } else if(fid === 'annex-d'){
      const dimLabels = [
        'Topics discussed during the session',
        'Relevance of the session to the counseling plan',
        'Means of achieving the counseling plan goals and objectives',
        'Interventions and techniques used during the session and their effectiveness',
        'Counseling observations',
        'Progress or setbacks',
        'Signs, symptoms, and any increase or decrease in the severity of behaviors as they relate to the main concern',
        'Homework assigned, results, and compliance (if any)',
        'The counselee’s current strengths and challenges'
      ];
      return `
        ${headerHtml}
        <div class="form-title">ANNEX D</div>
        <div class="form-subtitle">CASE NOTES TEMPLATE</div>
        <div class="meta-line">
          <span><b>Name of Counselee:</b> <span class="val-line" style="min-width:240px">${esc(d.name || '')}</span></span>
          <span><b>Session No.:</b> <span class="val-line" style="min-width:70px">${esc(d.sess || '')}</span></span>
          <span><b>Date:</b> <span class="val-line" style="min-width:120px">${esc(d.date || '')}</span></span>
        </div>
        <div class="meta-line">
          <span><b>Grade Level & Section:</b> <span class="val-line" style="min-width:200px">${esc(d.gr || '')}</span></span>
        </div>
        <table class="tbl-print" style="margin-top:14px">
          <thead>
            <tr>
              <th style="width:42%">Session Dimension</th>
              <th style="width:58%">Clinical Notes & Progress Summary</th>
            </tr>
          </thead>
          <tbody>
            ${dimLabels.map((lbl, idx)=>`
              <tr>
                <td><b>${lbl}</b></td>
                <td>${esc(d['d'+(idx+1)] || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="sig-container">
          <div class="sig-box">
            <div class="sig-line">${esc(d.prep || 'Guidance Counselor')}</div>
            <div class="sig-sub">Signature over printed name of Guidance Counselor</div>
          </div>
        </div>
      `;
    }
    return '';
  }

  function printFormDoc(title, htmlContent){
    const w = window.open('', '_blank');
    if(!w){
      toast('Popup window blocked. Please allow popups to print/download PDF.', 4500);
      return;
    }
    w.document.write(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>${esc(title)}</title>
      <style>
        @page { size: A4 portrait; margin: 14mm 16mm; }
        body { font-family: 'Public Sans', Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; margin: 18px 24px; background: #fff; }
        .deped-hdr { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
        .deped-hdr .rep { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
        .deped-hdr .dept { font-size: 11pt; font-weight: bold; text-transform: uppercase; }
        .deped-hdr .divn { font-size: 9.5pt; }
        .deped-hdr .sch { font-size: 11.5pt; font-weight: bold; }
        .deped-hdr .off { font-size: 10pt; font-style: italic; }
        .form-title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 10px 0 2px; letter-spacing: 0.5px; }
        .form-subtitle { text-align: center; font-size: 10.5pt; font-weight: bold; margin-bottom: 10px; }
        .meta-line { margin: 6px 0; font-size: 10pt; display: flex; flex-wrap: wrap; gap: 6px 18px; }
        .meta-line span { display: inline-flex; align-items: baseline; }
        .val-line { border-bottom: 1px solid #000; min-width: 120px; padding: 0 4px; font-weight: 600; }
        table.tbl-print { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt; }
        table.tbl-print th, table.tbl-print td { border: 1px solid #000; padding: 5px 6px; text-align: left; vertical-align: top; }
        table.tbl-print th { background: #f1f5f9; font-weight: bold; }
        .q-row { margin: 8px 0; font-size: 10pt; }
        .q-prompt { font-weight: bold; margin-bottom: 2px; }
        .q-answer { padding: 4px 6px; border-bottom: 1px solid #999; min-height: 18px; font-style: italic; color: #111; }
        .sig-container { margin-top: 24px; display: flex; justify-content: space-between; page-break-inside: avoid; }
        .sig-box { width: 240px; text-align: center; margin-top: 30px; }
        .sig-line { border-top: 1px solid #000; padding-top: 4px; font-weight: bold; font-size: 9.5pt; }
        .sig-sub { font-size: 8.5pt; color: #333; }
        .box-note { border: 1px solid #000; padding: 8px 10px; margin: 8px 0; font-size: 9pt; background: #fafafa; }
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position:fixed;top:10px;right:10px;background:#fff;padding:8px 12px;box-shadow:0 2px 10px rgba(0,0,0,.2);border-radius:6px;z-index:999">
        <button onclick="window.print()" style="background:#1e3a8a;color:#fff;border:0;padding:8px 16px;border-radius:6px;font-weight:bold;cursor:pointer">🖨 Print / Save as PDF</button>
      </div>
      ${htmlContent}
    </body>
    </html>`);
    w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); }, 400);
  }

  function downloadDocFile(filename, title, bodyHtml){
    const docContent = `<!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${title}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; margin: 1in; color: #000; }
      h1, h2, h3 { text-align: center; margin: 4pt 0; }
      .deped-hdr { text-align: center; border-bottom: 2pt solid #000; padding-bottom: 8pt; margin-bottom: 14pt; }
      table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 10pt; }
      th, td { border: 1pt solid #000; padding: 5pt 6pt; text-align: left; vertical-align: top; }
      th { background: #f0f0f0; font-weight: bold; }
      .sig-line { border-top: 1pt solid #000; width: 220pt; text-align: center; padding-top: 4pt; margin-top: 36pt; }
    </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>`;
    const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.doc') ? filename : filename + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  function printBlankForm(fid){
    const f = GUIDANCE_FORMS.find(x=>x.id===fid) || GUIDANCE_FORMS[0];
    const html = generateFormHtml(fid, true, {});
    printFormDoc(f.title + ' (Blank)', html);
    toast('Opening clean blank printable for ' + f.title + '.');
  }

  function downloadWordFile(fid, isBlank){
    const f = GUIDANCE_FORMS.find(x=>x.id===fid) || GUIDANCE_FORMS[0];
    const html = generateFormHtml(fid, !!isBlank, {});
    const fname = f.code.replace(/[^a-zA-Z0-9_-]/g,'_') + (isBlank ? '_Blank_Template' : '_Document');
    downloadDocFile(fname, f.title, html);
    toast('Word document downloaded: ' + fname + '.doc');
  }

  function submitGenForm(fid, action){
    const f = GUIDANCE_FORMS.find(x=>x.id===fid) || GUIDANCE_FORMS[0];
    const g = id => $(id) ? $(id).value.trim() : '';

    let data = {};
    let learnerName = '';
    let learnerLrn = '';

    if(fid === 'anecdotal'){
      syncArRowsFromDOM();
      learnerName = g('gf_ar_name');
      data = {
        name: learnerName,
        school: g('gf_ar_school') || 'San Roque Elementary School',
        grade: g('gf_ar_grade'),
        section: g('gf_ar_sec'),
        rows: S.arRows,
        summary: g('gf_ar_summary'),
        prep: g('gf_ar_prep')
      };
    } else if(fid === 'annex-a'){
      learnerName = g('gf_aa_name');
      data = {
        name: learnerName,
        gr: g('gf_aa_gr'),
        parent: g('gf_aa_parent'),
        dt: g('gf_aa_dt'),
        counselor: g('gf_aa_counselor'),
        school: g('gf_aa_school')
      };
    } else if(fid === 'annex-b'){
      learnerName = g('gf_ab_name');
      data = {
        name: learnerName,
        date: g('gf_ab_date'),
        bdate: g('gf_ab_bdate'),
        sex: g('gf_ab_sex'),
        lang: g('gf_ab_lang'),
        grade: g('gf_ab_gr'),
        section: g('gf_ab_sec'),
        q1: g('gf_ab_q1'),
        q2: getRadioVal('gf_ab_q2', 'Serious'),
        q3: getRadioVal('gf_ab_q3', '0-3 months'),
        q4: g('gf_ab_q4'),
        q5: g('gf_ab_q5'),
        q6: g('gf_ab_q6'),
        q7: g('gf_ab_q7'),
        q8: g('gf_ab_q8'),
        q9: g('gf_ab_q9'),
        q10: g('gf_ab_q10'),
        q11: getRadioVal('gf_ab_q11', 'just enough'),
        q12: g('gf_ab_q12'),
        q13: g('gf_ab_q13'),
        q14: g('gf_ab_q14'),
        q15: getRadioVal('gf_ab_q15', 'hopeful'),
        q16: g('gf_ab_q16'),
        q17: g('gf_ab_q17'),
        intName: g('gf_ab_int_name'),
        intDate: g('gf_ab_int_date'),
        intProb: g('gf_ab_int_prob'),
        intSeek: g('gf_ab_int_seek'),
        intCirc: g('gf_ab_int_circ'),
        intNotes: g('gf_ab_int_notes')
      };
    } else if(fid === 'annex-c'){
      syncCpRowsFromDOM();
      learnerName = g('gf_ac_name');
      data = {
        name: learnerName,
        gr: g('gf_ac_gr'),
        g1: g('gf_ac_g1'),
        g2: g('gf_ac_g2'),
        g3: g('gf_ac_g3'),
        rows: S.cpRows,
        prep: g('gf_ac_prep')
      };
    } else if(fid === 'annex-d'){
      learnerName = g('gf_ad_name');
      data = {
        name: learnerName,
        sess: g('gf_ad_sess'),
        date: g('gf_ad_date'),
        gr: g('gf_ad_gr'),
        d1: g('gf_ad_d1'),
        d2: g('gf_ad_d2'),
        d3: g('gf_ad_d3'),
        d4: g('gf_ad_d4'),
        d5: g('gf_ad_d5'),
        d6: g('gf_ad_d6'),
        d7: g('gf_ad_d7'),
        d8: g('gf_ad_d8'),
        d9: g('gf_ad_d9'),
        prep: g('gf_ad_prep')
      };
    }

    const matchedP = P.find(p=>norm(p.name)===norm(learnerName));
    learnerLrn = matchedP ? matchedP.lrn : '107001230099';

    const html = generateFormHtml(fid, false, data);

    if(action === 'print'){
      printFormDoc(f.title + (learnerName ? ' - ' + learnerName : ''), html);
      toast('Opening print view for ' + f.title + '.');
    } else if(action === 'doc'){
      const fname = f.code.replace(/[^a-zA-Z0-9_-]/g,'_') + (learnerName ? '_' + learnerName.replace(/\s+/g,'_') : '_Document');
      downloadDocFile(fname, f.title, html);
      toast('Downloaded ' + fname + '.doc');
    } else if(action === 'vault'){
      const docEntry = {
        name: f.code.replace(/[^a-zA-Z0-9_-]/g,'_') + '_' + (learnerName ? learnerName.replace(/\s+/g,'_') : 'Form') + '.pdf',
        d: iso(0),
        lrn: learnerLrn,
        text: `${f.title}\nLearner: ${learnerName || 'Not specified'}\nGenerated via Kalinga Forms Generator on ${iso(0)}\nCategory: ${f.category}`,
        cat: f.category,
        pn: learnerName || 'San Roque Learner'
      };
      S.docs.unshift(docEntry);
      save();
      toast('Form successfully filed and archived into Calamity Vault.');
      S.modal = null;
      render();
    }
  }

  function vForms(){
    const q = (S.formsQ || '').toLowerCase().trim();
    const cat = S.formsCat || 'All';
    const list = GUIDANCE_FORMS.filter(f => {
      const matchQ = !q || f.title.toLowerCase().includes(q) || f.code.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q);
      const matchCat = cat === 'All' || f.category === cat;
      return matchQ && matchCat;
    });

    return `
      <div class="top">
        <div>
          <h2>Guidance Download Forms & Document Generator</h2>
          <p class="lede">Standard DepEd and Guidance Office annexes and student records. Click <b>Generate Form</b> on the right to open the fill-out pop up and generate/download your form, or download clean blank copies for physical use.</p>
        </div>
      </div>

      <div class="blk" style="margin-bottom:18px">
        <div class="row2">
          <label style="margin-top:0;flex:1 1 260px">
            Search Guidance Forms
            <input id="fq" placeholder="Search by form name, Annex code, or keyword..." value="${esc(S.formsQ||'')}" oninput="S.formsQ=this.value;render()">
          </label>
          <div style="flex:1 1 260px">
            <label style="margin-top:0">Filter by Category</label>
            <div class="pills" style="margin:0">
              ${['All','Annexes','Behavioral Records'].map(c=>`<button aria-pressed="${(S.formsCat||'All')===c}" onclick="S.formsCat='${c}';render()">${c}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="blk">
        <div class="item" style="padding-top:0">
          <div><h3 style="margin:0">Official Forms Directory (${list.length} available)</h3></div>
          <span class="mute">Compliant with DepEd DO 40 s. 2012 & RA 10173</span>
        </div>
        ${list.map(f => `
          <div class="form-item-card">
            <div class="form-item-left">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span class="tag good" style="background:var(--primary);color:#fff;font-weight:700">${f.code}</span>
                <span class="tag warn">${f.badge}</span>
                <span class="mute">${f.category}</span>
              </div>
              <b style="font-size:16px">${f.title}</b>
              <p class="mute" style="margin:4px 0 0;line-height:1.4">${f.desc}</p>
            </div>
            <div class="form-item-right">
              <button class="btn y s" onclick="openGenModal('${f.id}')">📄 Generate Form</button>
              <button class="btn s o" onclick="printBlankForm('${f.id}')">🖨 Blank Print / PDF</button>
              <button class="btn s o" onclick="downloadWordFile('${f.id}', true)">⬇ Download .DOC</button>
            </div>
          </div>
        `).join('') || '<p class="empty">No guidance forms match your filter.</p>'}
      </div>
    `;
  }

  /* ---- shell ---- */
  function side(){const u=S.user;$('side').innerHTML=`<div><div class="brand">KALINGA Parent-Counselor Conference Management and Student Guidance Intervention System with Dual-Channel Notification and Document Digitization</div><br>
  <div class="who">${u?`<span>${esc(u.name)}</span><button onclick="S.user=null;S.chat=null;render()">Log out</button>`:''}</div>`}
  function tabs(){const u=S.user,N={guidance:[['today','Overview',pend()+S.cases.filter(c=>c.st=='New').length+unread()+pendingStaff().length],['cases','Intake and cases'],['sched','Schedule'],['kids','Learners'],['forms','Download Forms',GUIDANCE_FORMS.length],['vault','Records'],['desk','Helpdesk',unread()],['staff','Settings',pendingStaff().length]],teacher:[['refer','Refer a pupil'],['track','Referral progress'],['slips','Call slips'],['stats','Class overview']],parent:[['portal','My child']]}[u&&u.role]||[];
  return N.length>1?`<div class="tabs">${N.map(([k,l,n])=>`<button ${S.tab==k?'aria-current="page"':''} onclick="go('${k}')">${l}${n?`<span class="badge">${n}</span>`:''}</button>`).join('')}</div>`:''}
  function render(focus){purge();side();const u=S.user;
  $('main').innerHTML=tabs()+(S.pupil&&!u?vPupil():S.tab==='forms'?vForms():!u?vAuth():u.role=='guidance'?({today:vToday,cases:vCases,sched:vSched,kids:vKids,vault:vVault,desk:vDesk,staff:vStaff,forms:vForms}[S.tab]||vToday)():u.role=='teacher'?vTeacher():vParent());
  modal();const cb=$('cb');if(cb)cb.scrollTop=cb.scrollHeight;if(focus&&$(focus))$(focus).focus();else if(!S.modal)window.scrollTo(0,0)}
  render();

  