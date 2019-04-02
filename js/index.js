var ChineseOP = { '+': '＋', '-': '－', '*': '×', '/': '÷'};
var haveError = false;
var haveWarning = false;
var g_mul_result = []; // 范围内可能的乘积，每次变化时重算
var g_divisor = []; // 整除时被除数可能值列表

Bmob.initialize("35c1b0a4c67d455ed4d0a44323636000", "73ace548628229c78127e73f4fdb918a");

function setWarning() {
	haveWarning = true;
	console.warn.apply(console, arguments);
}

function setError() {
	haveError = true;
	console.error.apply(console, arguments);
}

/**
 * 判断一个整数是否是素数
 * @param {integer} num 
 */
function isPrime(num) {
	return !/^1?$|^(11+?)\1+$/.test(Array(num + 1).join('1'))
}

/**
 * 求两个范围的交集（范围示例：{min: 0, max: 99})
 * @param {object} range1 
 * @param {object} range2 
 * @return {bool|object} 无交集返回 false, 否则返回交集对象
 */
function intersectionRange(range1, range2) {
	if( range1.min - 0 > range2.max - 0 || range2.min - 0 > range1.max - 0) {
		setError('    错误：范围没有交集，range1 =', JSON.stringify(range1), '，range2 =', JSON.stringify(range2));
		return false;
	}
	// 取理论范围 和用户设置范围 的交集
	var arr1 = [range1.min - 0, range1.max - 0, range2.min, range2.max].sort(function (a, b) {
		return a - b;
	});
	return {min: arr1[1] - 0, max: arr1[2] - 0};
}

/**
 * 生成指定范围内的随机整数
 * @param int Min 最小值
 * @param int Max 最大值
 * @param array[int] genotinarr 随机出的数值个位数必须不在 genotinarr 数组中
 * @param array[int] geinarr 随机出的数值个位数必须在 geinarr 数组中
 * @param array[int] notinarr 随机出的数值不可包含在 notinarr 数组中
 * @param array[int] inarr 只随机一个数组中的数值
 * @returns {number}
 */
function randomInt(Min, Max, genotinarr, geinarr, notinarr, inarr) {
	Min = parseInt(Min);
	Max = parseInt(Max);
	if( Max < Min ) {
		setError("    错误：无效的范围 min =", Min, ", max =", Max);
		haveError = true;
		Max = Min; // 保证范围有效！
	}
	var Range = Max - Min;
	var Rand = Math.random();
	var num = Min + Math.round(Rand * Range);
	var i = 0, pos;
	
	// 克隆一份数组，避免原数组被修改
	genotinarr = ( 'object' == typeof(genotinarr) ) ? genotinarr.concat() : [];
	geinarr = ( 'object' == typeof(geinarr) ) ? geinarr.concat() : [];
	notinarr = ( 'object' == typeof(notinarr) ) ? notinarr.concat() : [];
	inarr = ( 'object' == typeof(inarr) ) ? inarr.concat() : [];

	// 必须是指定列表中的数值，这种情况应该从 inarr 中寻找满足条件的数值：
	if ( inarr.length > 0) {
		var right_nums = [];
		// 挑选出满足条件的数值列表，然后再从里面随机出一个数
		for(i = 0; i < inarr.length; i ++) {
			if ( (inarr[i] < Min || inarr[i] > Max)
				|| (genotinarr.length > 0 && genotinarr.indexOf(inarr[i] % 10) >= 0)
				|| (geinarr.length > 0 && geinarr.indexOf(inarr[i] % 10) < 0)
				|| (notinarr.length > 0 && notinarr.indexOf(inarr[i]) >= 0) ) {
				continue; // 不符合
			}
			right_nums.push(inarr[i]);
		}
		if( right_nums.length <= 0 ) {
			right_nums = inarr;
			setError('    错误：inarr 中一共', inarr.length, '个数值，但没有一个能满足要求。');
		} 
		num = 0 + Math.round(Math.random() * (right_nums.length - 1 - 0));
		num = right_nums[num];
	} else {
		// 范围内整数可能的个位列表(只要连续10个数以上，个位应该是0-9全的)
		var ges = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		if( Max - Min + 1 < 10 ) { // 只有范围不足 10 个整数时，才需要得到个位列表
			for(ges = [], i = Min; i <= Max; i ++) {
				ges.push(i % 10);
			}
		}
		for(i = 0; i < genotinarr.length; i ++) { // 移除必须不含的个位
			pos = ges.indexOf(genotinarr[i]);
			if( pos >= 0 ) ges.splice(pos, 1);
		}
		for(i = 0; i < geinarr.length; i ++) { // 再移除不是【只能是】的个位
			pos = ges.indexOf(geinarr[i]);
			if( pos < 0 ) ges.splice(pos, 1);
		}
		if( ges.length <= 0 ) { // 范围内没有整数可以满足对个位数的要求？
			num = Min + Math.round(Math.random() * (Max - Min));
			setError('    错误：范围 '+Min+'~'+Max+' 中无法满足个位要求。');
		} else {
			// 由于大多数能随机成功，先随机几次试试，万一命中的话，就不需要再次尝试，以提高效率：
			for(i = 0; i < 10; i ++) {
				num = Min + Math.round(Math.random() * (Max - Min));
				if ( ! ( ges.indexOf(num % 10) < 0 || (notinarr.length > 0 && notinarr.indexOf(num) >= 0 ) ) ) {
					break;
				}
			}
			// 仍未命中有效值，只能使用万全的笨方法了：
			if ( ges.indexOf(num % 10) < 0 || (notinarr.length > 0 && notinarr.indexOf(num) >= 0 ) ) {
				var tmparr = [];
				// 找到所有可能的有效值列表
				for(num = Min; num <= Max; num ++) {
					if ( ges.indexOf(num % 10) < 0 || (notinarr.length > 0 && notinarr.indexOf(num) >= 0 ) ) {
						continue; // 不符合
					}
					tmparr.push(num);
				}
				if( tmparr.length <= 0 ) {
					num = Min + Math.round(Math.random() * (Max - Min));
					setError('    错误：未能生成范围('+Min+'~'+Max+')内的数值！',
						'个位不含('+ genotinarr.join(',')+')', '个位必含('+geinarr.join(',')+')', 
						'不含('+notinarr.join(',')+')', '必含('+inarr.join(',')+')');
				} else {
					pos = 0 + Math.round(Math.random() * (tmparr.length - 1 - 0));
					num = tmparr[pos];
				}
			}
		}
	}

	return num;
}

//set default value
var app = new Vue({
	el: '#app',
	data: {
		count: 100,
		pagerows: 25,
		cols: 4,

		strategy: 'random',
		diff_operator_adjacent: false,
		dissimilarity_operator_adjacent: true,

		isadd: true,
		issub: true,
		ismul: true,
		isdiv: true,
		rule: '1',
		whichcond: '',
		exact_parentheses: false,
		parentheses: {autofix: true, enabled: false, min: 0, max: 0}, // 是否生成带括号的题

		itemcount: 0,

		// 符号
		range_op: [],

		// 加法
		defrange_add: [{min: 0, max: 100}, {min: 0, max: 100}],
		result_add: {min: 0, max: 200},
		range_add: [],

		// 减法
		defrange_sub: [{min: 0, max: 200}, {min: 0, max: 100}],
		result_sub: {min: 0, max: 100},
		range_sub: [],

		// 乘法
		defrange_mul: [{min: 0, max: 9}, {min: 0, max: 9}],
		result_mul: {min: 4, max: 81},
		range_mul: [],

		// 除法
		defrange_div: [{min: 0, max: 81}, {min: 1, max: 9}],
		result_div: {min: 2, max: 9},
		range_div: [],

		fontsize: 12,
		fontfamily: '宋体',
		cellPadding: 2,
		cellSpacing: 5,
		res: [],
		appendemptyrows: false,
		report: {
			total: 0,
			addcnt: 0, // 加法题数量
			subcnt: 0, // 减法题数量
			mulcnt: 0, //乘法题数量
			divcnt: 0, //除法题数量
			exceptcnt: 0 // 异常题数量(由于冲突，未能按规则生成)
		}
	},
	created: function () {
		this.itemcount = 2;
	},
	watch: {
		count: function (val, oldval) {
			if (val < 1) this.count = 1;
			if (val > 1000) this.count = 1000;
		},
		pagerows: function (val, oldval) {
			if (val < 1) this.pagerows = 1;
			if (val > 100) this.pagerows = 100;
		},
		cols: function (val, oldval) {
			if (val < 1) this.cols = 1;
			if (val > 10) this.cols = 10;
		},
		fontsize: function (val, oldval) {
			if (val < 8) this.fontsize = 8;
			if (val > 30) this.fontsize = 30;
		},
		cellPadding: function (val, oldval) {
			if (val < 0) this.cellPadding = 0;
		},
		cellSpacing: function (val, oldval) {
			if (val < 2) this.cellSpacing = 2;
		},
		itemcount: function (val, oldval) {
			if (val < 2) {
				this.itemcount = 2;
				return;
			}
			if (val > 4) {
				this.itemcount = 4;
				return;
			}
			if (val > 2) {
				this.parentheses.enabled = true;
				if (this.parentheses.min < 0) this.parentheses.min = 0;
				if (this.parentheses.max < 0) this.parentheses.max = 0;
				if (this.parentheses.max > val - 1) this.parentheses.max = val - 1;
				if (this.parentheses.min > this.parentheses.max) this.parentheses.max = this.parentheses.max;
			} else {
				this.parentheses.enabled = false;
				this.parentheses.min = 0;
				this.parentheses.max = 0;
			}
			this.parentheses.enabled = val > 2;
			for (var i = 0; i < val; i++) {
				if (!this.range_op[i] && i < val - 1) {
					this.range_op.splice(i, 1, {
						add: true,
						sub: true,
						mul: true,
						div: true,
						parentheses: false,
						all: true
					});
				}
				if( i > 1 ) break; 
				if (!this.range_add[i]) {
					this.range_add.splice(i, 1, {
						min: (i > 0 ? this.defrange_add[1].min : this.defrange_add[0].min),
						max: (i > 0 ? this.defrange_add[1].max : this.defrange_add[0].max)
					});
				}
				if (!this.range_sub[i]) {
					this.range_sub.splice(i, 1, {
						min: (i > 0 ? this.defrange_sub[1].min : this.defrange_sub[0].min),
						max: (i > 0 ? this.defrange_sub[1].max : this.defrange_sub[0].max)
					});
				}
				if (!this.range_mul[i]) {
					this.range_mul.splice(i, 1, {
						min: (i > 0 ? this.defrange_mul[1].min : this.defrange_mul[0].min),
						max: (i > 0 ? this.defrange_mul[1].max : this.defrange_mul[0].max)
					});
				}
				if (!this.range_div[i]) {
					this.range_div.splice(i, 1, {
						min: (i > 0 ? this.defrange_div[1].min : this.defrange_div[0].min),
						max: (i > 0 ? this.defrange_div[1].max : this.defrange_div[0].max)
					});
				}
			}
			if (this.range_op.length > this.itemcount - 1) {
				this.range_op.splice(this.itemcount - 1);
			}
			if (this.range_add.length > this.itemcount) {
				this.range_add.splice(this.itemcount);
			}
			if (this.range_sub.length > this.itemcount) {
				this.range_sub.splice(this.itemcount);
			}
			if (this.range_mul.length > this.itemcount) {
				this.range_mul.splice(this.itemcount);
			}
			if (this.range_div.length > this.itemcount) {
				this.range_div.splice(this.itemcount);
			}
		}
	},
	methods: {
		op: function () {
			var ops = [];
			if (this.isadd) ops.push('+');
			if (this.issub) ops.push('-');
			if (this.ismul) ops.push('*');
			if (this.isdiv) ops.push('/');
			if (ops.length < 1) return '+';
			if (ops.length == 1) return ops[0];
			var rnd = parseInt(Math.random() * 1000) % ops.length;
			return ops[rnd];
		},

		isValid: function () {
			if (!(this.isadd || this.issub || this.ismul || this.isdiv)) {
				alert('必须至少指定一种运算符！');
				return false;
			}
			if (this.result_add.max - 0 < this.result_add.min - 0) {
				alert('加法得数范围无效！');
				return false;
			}
			if (this.result_sub.max - 0 < this.result_sub.min - 0) {
				alert('减法得数范围无效！');
				return false;
			}
			if (this.result_mul.max - 0 < this.result_mul.min - 0) {
				alert('乘法得数范围无效！');
				return false;
			}
			if (this.result_div.max - 0 < this.result_div.min - 0) {
				alert('除法得数范围无效！');
				return false;
			}
			for (var i = 0; i < this.itemcount; i++) {
				if( i > 1 ) break; 
				if (this.range_add[i].max - 0 < this.range_add[i].min - 0) {
					alert('加法数值' + (i + 1) + '范围无效！');
					return false;
				}
				if (this.range_sub[i].max - 0 < this.range_sub[i].min - 0) {
					alert('减法数值' + (i + 1) + '范围无效！');
					return false;
				}
				if (this.range_mul[i].max - 0 < this.range_mul[i].min - 0) {
					alert('乘法数值' + (i + 1) + '范围无效！');
					return false;
				}
				if (this.range_div[i].max - 0 < this.range_div[i].min - 0) {
					alert('除法数值' + (i + 1) + '范围无效！');
					return false;
				}
			}

			// @todo 其它非法检测

			return true;
		},

		genItem: function () {

			// 限制条件：
			// 1. 减法时必须保证第二个数必须比第一个数小，以避免产生负数结果
			// 2. 除法必须都能整除
			var op = this.op(), t, r, res;

			var range = ({'+': this.range_add, '-': this.range_sub, '*': this.range_mul, '/': this.range_div})[op];
			var result = {'+': this.result_add, '-': this.result_sub, '*': this.result_mul, '/': this.result_div}[op];

			var w = '' === this.whichcond ? randomInt(0, this.itemcount - 1) : this.whichcond - 0; // 已知得数，随机求某一个条件
			var min = range[0].min, max = range[0].max, limit = [], isexcept = false;

			var arr1, rg1;

			if ('+' == op) {
				// 加法：根据结果和加数的限制范围，确定被加数的范围
				rg1 = {min: result.min - range[1].min, max: result.max - range[1].min};
			} else if ('-' == op) {
				// 减法：根据结果和减数的限制范围，确定被减数的范围，确保能在最小的减数上能产生借位
				min = Math.max(min, (range[1].min - 0) + (result.min - 0)); // 被减数不允许比(减数+得数)还小，这会产生负数结果
				rg1 = {min: (result.min - 0) + (range[1].min - 0), max: (result.max - 0) + (range[1].min - 0)};
			} else if ('*' == op) {
				// 乘法：根据结果和乘数的限制范围，确定被乘数的范围 (注意除数不能为0)
				rg1 = {
					min: (range[1].min == 0 ? 0 : Math.round(result.min / range[1].min)),
					max: (range[1].min == 0 ? result.max : Math.round(result.max / range[1].min))
				};
			} else if ('/' == op) {
				// 除法：根据商和除数的限制范围，确定被除数的范围
				rg1 = {
					min: Math.round(result.min * range[1].min),
					max: Math.round(result.max * range[1].max)
				};
			}

			// 数值 1 范围 = 可用范围与用户设置的范围求交集
			arr1 = [min - 0, max - 0, rg1.min, rg1.max].sort(function (a, b) {
				return a - b;
			});
			min = arr1[1], max = arr1[2];


			//
			// 先生成 r = “被加数"、"被减数"、"被乘数"、"被除数"
			//

			if ('+' == op) {
				// 加法：数值 1 的最小值都超过了得数允许的最大值，则无法使用加法
				if (min > result.max) {
					// 智能处理：如果可以使用减法，尝试变更运算符？
					if (this.issub) {
						setWarning('被加数最小值超出了得数允许的最大范围，将智能变更为减法！')
						op = '-';
						r = randomInt(min, max, limit);
					} else {
						isexcept = true;
						setError('错误：被加数最小值超出了得数允许的最大范围！')
					}
				} else {
					// 被加数不能超过结果允许的最大值
					max = Math.min(max, result.max);
					r = randomInt(min, max, limit);
				}
			}
			else if ('-' == op) {
				// 减法：必须保证被减数不可小于允许结果的最小值
				if (max < result.min) {
					// 如果可以使用加法，尝试变更运算符？
					if (this.isadd) {
						setWarning('被减数最大值比得数允许的最小范围还要小，智能变更为加法！')
						op = '+';
						r = randomInt(min, max, limit);
					} else {
						isexcept = true;
						setError('错误：被减数最大值比得数允许的最小范围还要小！')
					}
				} else {
					min = Math.max(min, result.min);
					r = randomInt(min, max, limit);
				}
			}
			else if ('*' == op) {
				// 乘法：最小的积  比最大结果还大
				if (min > result.max) {
					if (this.issub) {
						setWarning('被乘数最小值超出了得数允许的最大范围，将智能变更为减法！')
						op = '-';
						r = randomInt(min, max, limit);
					} else {
						isexcept = true;
						setError('错误：被乘数最小值超出了得数允许的最大范围！')
					}
				} else {
					// 被乘数不能超过结果允许的最大值
					max = Math.min(max, result.max);
					r = randomInt(min, max, limit);
				}
			}
			else if ('/' == op) {
				// 除法必须保证被除数能除得尽，不能有小数！要做整除？
				// 除法：必须保证被除数不可小于允许结果的最小值
				if (max < result.min) {
					if (this.ismul) {
						setWarning('被除数最大值比得数允许的最小范围还要小，智能变更为乘法！')
						op = '*';
						r = randomInt(min, max); // 随机生成被乘数
					} else {
						isexcept = true;
						setError('错误：被除数最大值比得数允许的最小范围还要小！')
					}
				} else {
					r = randomInt(min, max, [], [], [0]); // 随机生成被除数
				}
			}

			// 如果前面无法生成合法的数值，这里就直接按数值 1 限定范围生成随机数即可！因为无论如何它将是一个异常的值！
			if ('undefined' == typeof(r)) {
				r = randomInt(range[0].min, range[0].max, limit);
			}

			// 已知得数，求条件，且第一个数就是被求的条件? 则将该数使用空白代替！
			var arr = [('2' == this.rule && 0 == w) ? this.blank(r) : r];
			for (var i = 1; i < this.itemcount; i++, op = this.op()) {

				for (var j = min; j <= max; j++) {
					res_ge.push('+' == op ? (ge + j) % 10 : (ge + 10 - j) % 10);
				}

				// 根据已知的被加/减数、加/减数范围得到得数的范围，然后和用户设置的得数范围合并
				var rgc = {min: eval(r + op + range[i].min), max: eval(r + op + range[i].max)};
				var rgarr = [rgc.min - 0, rgc.max - 0, result.min - 0, result.max - 0].sort(function (a, b) {
					return a - b;
				});
				// 取两个范围相交的部分
				var rgr = {min: rgarr[1], max: rgarr[2]};

				//console.log('rgr', rgr);

				// 先随机算出得数，再根据得数算出加数/减数/除数 ...
				if ('+' == op) {
					// 加法结果范围：被加数(r) ~ rgr.max
					min = Math.max(r, rgr.min);
					max = rgr.max;
					if (min > max) {
						setError('错误：无法保证加法得数在设定范围内！');
						max = min;
						isexcept = true;
					}
					res = randomInt(min, max, undefined, res_ge);
					t = res - r;
				}

				if ('-' == op) {
					// 减法结果范围：rgr.min ~ 被减数(r)
					min = Math.max(0, rgr.min);
					max = Math.min(r, rgr.max);
					if (min > max) {
						setError('错误：无法保证减法得数在设定范围内！');
						min = max;
						isexcept = true;
					}
					res = randomInt(min, max, undefined, res_ge);
					t = r - res;
				}

				if ('*' == op) {
					// 乘法结果范围：被乘数(r) ~ rgr.max
					min = Math.max(r, rgr.min);
					max = rgr.max;
					if (min > max) {
						setError('错误：无法保证乘法得数在设定范围内！');
						max = min;
						isexcept = true;
					}
					// 要考虑结果得能除得尽被乘数才行
					res = randomInt(min, max, undefined, res_ge);
					if (res % r != 0) {
						setError(res, r, '除不尽');
					} // 除不尽也没事，后面会重算！就是结果可能超出范围！
					// 被乘数为 0? 乘数随机一个值！
					if (r == 0) t = randomInt(range[i].min, range[i].max); // 0 乘以 任何数都等于 0
					else t = Math.round(res / r);
				}

				if ('/' == op) {
					// 除法忽略被除数范围
					// 除法结果范围：rgr.min ~ 被减数
					min = Math.max(0, rgr.min);
					max = Math.min(r, rgr.max);
					if (min > max) {
						setError('错误：无法保证除法得数在设定范围内！');
						min = max;
						isexcept = true;
					}
					// 先随机生成【商】res，然后再重随机得到【除数】t，这样才能修正【被除数】r 以实现整除
					// r / t = res 
					res = (0 == r) ? 0 : randomInt(min, max, [], [], [0]); // 随机生成商
					if (0 == res) { // 如果商为 0?
						// 由于 0 除以 任何数都等于 0，所以这里随便生成一个范围内的除数，但除数不能为 0
						t = randomInt(range[i].min, range[i].max, [], [], [0]);
					} else {// 如果商不为零？
						t = randomInt(range[i].min, range[i].max, [], [], [0]); // 除数不零为 0
					}

					// @在连式运算中 r 被修正可能会出问题，因为 r 是前面算式的结果
					if ( range.length < 3) {
						// 确保能除尽(所以要重新修正【被除数】 r = t * res)，有可能导致被除数超出设定范围
						arr[arr.length - 1] = r = res * t;
					} else {
						// 非除尽? 保持【被除数】r 和【商】res 不变，重新计算 t，但这样做有可能让 t 超出它的限制范围!(从而可能违背 10 以内的限制条件)
						// 还是修正【被除数】 r 吧？ 并且需要随机模拟除不尽的情况
						arr[arr.length - 1] = r = res * t + (res ? randomInt(0, t - 1) : 0);
					}
					console.log('r=', r, 't=', t, 'res=', res);
				}

				if (t < range[i].min || t > range[i].max) {
					setError('错误：为保证得数在范围内，加数/减数将超出范围！', t, range[i].min, range[i].max);
					isexcept = true;
				}

				// 已知得数，求条件时，将条件换成空白
				arr.push(op); // 运算符号
				arr.push(('2' == this.rule && i == w) ? this.blank(t) : t);

				// 计算得数
				r = Math.floor(eval(r + op + t));
			}

			// 得数
			arr.push('=');
			arr.push((/*true ||*/'2' == this.rule) ? r : this.blank(r))

			this.report.addcnt += '+' == op ? 1 : 0;
			this.report.subcnt += '-' == op ? 1 : 0;
			this.report.mulcnt += '*' == op ? 1 : 0;
			this.report.divcnt += '/' == op ? 1 : 0;
			this.report.exceptcnt += isexcept ? 1 : 0;

			return arr;
		},


		/**
		 * 根据两项式的运算符、运算结果和其中一项运符项的值，求另个运算项的值
		 * @param object item 两项式对象
		 * @param int item1_val 运算项1的值
		 * @return int item2_val 返回另一运算项的值
		 */
		calcItem2Value: function (items, item, item1_val) {
			var dst_lor = 'lft' == item.lor ? 'rgt': 'lft';
			var range, notinarr;

			if ('+' == item.operator) {
				return item.result - item1_val;
			}

			if ('-' == item.operator) {
				if ('lft' == item.lor) return item1_val - item.result;
				if ('rgt' == item.lor) return item1_val + item.result;
			}

			if ('*' == item.operator) {
				// 特殊情况：其中一个因子已经是 0 的情况，另一个则随机生成一个，避免生成 "0*0=0" 的形式
				if (0 == item1_val) {
					var range = this.getItemUserLORRange(item.operator, dst_lor);
					var notinarr = [0];
					return randomInt(range.min, range.max, [], [], notinarr);
				} else {
					return Math.round(item.result / item1_val); // 使用四舍五入以让偏差小一些 ...
				}
			}

			if ('/' == item.operator) {
				if ('lft' == item.lor) {
					// 已知被除数、商求除数，则：除数 = 被除数 / 商
					if( (item.result == 0 && item1_val != 0) || (item.result != 0 && item1_val == 0) ) {
						setError('    错误：被除数和商都应该是 0, 但被除数 =', item1_val, ', 商 =', item.result);
					}
					// 特殊情况：当被除数或者商为 0 时，除数无法计算，只能随机生成一个
					if (item1_val == 0 || item.result == 0) {
						var range = this.getItemUserLORRange(item.operator, dst_lor);
						var notinarr = [0];
						return randomInt(range.min, range.max, [], [], notinarr);
					}
					return Math.round(item1_val / item.result); // 使用四舍五入以让偏差更小一些 ...
				}
				if ('rgt' == item.lor) {
					if( 0 == item1_val ) {
						setError('    错误：被除数 == 0 了？');
					}
					return item1_val * item.result;
				}
			}
		},

		getItemUserLORRange: function (operator, lor) {
			var op_ranges = {'+': this.range_add, '-': this.range_sub, '*': this.range_mul, '/': this.range_div};
			var subi = 'lft' == lor ? 0 : 1;
			var item_user_range = op_ranges[operator][subi];  // 只使用了 0, 1 范围来代表左、右范围？
			return {min: item_user_range.min - 0, max: item_user_range.max - 0};
		},

		/**
		 * 根据两项式的运算符获取两项式中其中一个运算项的取值范围（用户在界面中设定）
		 * @param object item 两项式对象
		 * @param string lor 取值 'lft' | 'rgt'，代表两项式运算符左边|右边的运算项
		 * @param bool is_calc_by_result 是否已知结果
		 * @return json 返回 {min: <最小值>, max: <最大值>}
		 */
		calcItemLORRange: function (items, item, lor, is_calc_by_result) {
			// 按运算符得到【用户设置】的左右值范围
			var item_user_range = this.getItemUserLORRange(item.operator, lor);
			var item_new_range = {min: 0, max: 0};

			// 本层没有孩子两项式，或已经是最后一层子项式
			var child = false, child_result_range = false;
			if( ! (item.lor == lor && item.index < items.length - 1) ) {
				item_new_range.min = item_user_range.min - 0;
				item_new_range.max = item_user_range.max - 0;
			} else {
				// 如果要生成的左右值正好是一个【孩子两项式】，则需要合并子两项式的结果范围！！
				// 得到【孩子两项式】的结果范围
				// 注意：可能与 calcItemResultRange 形成递归调用关系！！
				child = items[item.index + 1];
				child_result_range = this.calcItemResultRange(items, child);
				var merge_range = intersectionRange(item_user_range, child_result_range);
				if( ! merge_range ) {
					setError('错误：本层运算符和下层结果范围没有交集');
					// 没有交集，直接返回用户设置范围
					item_new_range.min = item_user_range.min - 0;
					item_new_range.max = item_user_range.max - 0;
				} else {
					item_new_range.min = merge_range.min - 0;
					item_new_range.max = merge_range.max - 0;
				}
			}

			if( ! is_calc_by_result ) {
				return item_new_range;
			}

			// 已知运算符、运算结果 result 的情况，范围需要参考另一运算项范围
			var min, max;

			if( 0 == item.result ) {
				// 除法且结果为 0 的特殊情况处理
				if( '/' == item.operator ) {
					if( 'lft' == lor ) {
						min = max = 0; // 当结果为 0 时，被除数只能是 0，没有选择的余地
					} else {
						min = item_user_range.min, max = item_user_range.max; // 除数保持用户设置范围不变（被除数是0）
					}
					return {min: min - 0, max: max - 0};
				}
				// 乘法结果为 0 的特殊情况处理
				else if( '*' == item.operator ) {
					min = 0;
					max = item_user_range.max;
					return {min: min - 0, max: max - 0};
				}
			}
			
			// 深拷贝两项式，并设置 lor 为另一个，以便能求出本项取值范围
			var other = JSON.parse(JSON.stringify(item));
			other.lor = lor =='lft' ? 'rgt' : 'lft';

			// 得到另一个运算项的用户设置范围
			var other_range = this.getItemUserLORRange(other.operator, other.lor);

			if( '+' == other.operator ) {
				// 加法时，由于结果确定，一个运项变大，则另一运项需要变小
				min = this.calcItem2Value(items, other, other_range.max);
				max = this.calcItem2Value(items, other, other_range.min);
			} else if( '-' == other.operator ) {
				// 减法时，不管运算项是在运算符的左边还是右边，在结果确定的情况下，增减方向相同：
				min = this.calcItem2Value(items, other, other_range.min);
				max = this.calcItem2Value(items, other, other_range.max);
			} else if( '*' == other.operator ) {
				// 乘法时，且结果不为 0 的情况，最小值是 1
				min = (0 == other_range.max) ? 1 : this.calcItem2Value(items, other, other_range.max);
				max = ( 0 == other_range.min) ? other.result: this.calcItem2Value(items, other, other_range.min);
			} else if( '/' == other.operator ) {
				// 除法时，且结果不为 0 的情况，
				if( 'lft' == other.lor &&  other_range.min < other.result ) {
					other_range.min = other.result;
				}
				if( 'lft' == other.lor &&  other_range.max < other.result ) {
					other_range.max = other.result;
				}
				min = this.calcItem2Value(items, other, other_range.min);
				max = this.calcItem2Value(items, other, other_range.max);
			}

			// 合并根据 result 算出来的范围和用户设置范围？
			var fact_range = {min: min - 0, max: max - 0};
			var inter_range = intersectionRange(item_new_range, fact_range);
			if( ! inter_range ) {
				setError('    错误：根据结果算出来的范围和用户设置范围没有交集。');
				inter_range = item_new_range;
			}
		
			console.log(Array(item.index*4).fill('-').join('') + 'calcItemLORRange('+item.index+', '+item.lor+')：', '运算符：', item.operator, '，结果：', item.result, 
				'，用户设置范围：', item_user_range.min+'~'+item_user_range.max, 
				'，子层结果范围：', (child_result_range ? child_result_range.min+'~'+child_result_range.max : ''), 
				'，新范围：', item_new_range.min+'~'+item_new_range.max, 
				'，理论范围：', min+'~'+max, 
				'，最终范围：', inter_range.min+'~'+inter_range.max);

			return inter_range;
		},

		/*
		 * 得到用户设置的指定运算符的结果范围
		 */ 
		getItemUserResultRange: function(operator) {
			var user_result_range = { '+': this.result_add, '-': this.result_sub, '*': this.result_mul, '/': this.result_div }[operator];
			return {min: user_result_range.min - 0, max: user_result_range.max - 0};
		},

		/**
		 * 根据两项式的运算符获取两项式结果的取值范围（用户在界面中设定）
		 * @param object item 两项式对象
		 * @return json 返回 {min: <最小值>, max: <最大值>}
		 */
		calcItemResultRange: function(items, item) {
			// 得到【用户设置】的结果范围
			var user_result_range = this.getItemUserResultRange(item.operator);

			// 得到本层两项式的左、右运算项【理论范围】（在只知道运算符，不知道结果的情况下）
			var left_range = this.calcItemLORRange(items, item, 'lft', false);
			var right_range = this.calcItemLORRange(items, item, 'rgt', false);
			
			var min, max;

			// 根据左右运算项范围和运算符号计算出实际范围
			if( '+*'.indexOf(item.operator) >= 0 ) {
				min = eval(left_range.min + item.operator + right_range.min);
				max = eval(left_range.max + item.operator + right_range.max);
			} else if( '-' == item.operator ) {
				min = left_range.min - right_range.max;
				max = left_range.max - right_range.min;
			} else if( '/' == item.operator ) {
				min = (0 == right_range.max) ? 0 : Math.round(left_range.min / right_range.max); // 防止除0错误
				max = (0 == right_range.min) ? left_range.max : Math.round(left_range.max / right_range.min);
			}

			var inter_range = intersectionRange({min: min - 0, max: max - 0}, user_result_range);

			// 理论范围 和 用户设置范围 没有交集？
			if( ! inter_range ) {
				setError('运算符 "' + item.operator + '" 的得数范围设置不合理！需要重新修正！');
				return {min:min - 0, max:max - 0};
			} else {
				var parent_lor = item.index > 0 ? items[item.index -1].lor : '';
				console.log(Array(item.index*4).fill('-').join('') + 'calcItemResultRange('+item.index+', '+parent_lor+')：', '运算符：', item.operator, 
					'，左值范围：', left_range.min+'~'+left_range.max, 
					'，右值范围：', right_range.min+'~'+right_range.max, 
					'，用户设置范围：', user_result_range.min+'~'+user_result_range.max, 
					'，理论范围：', min+'~'+max,
					'，最终范围：', inter_range.min+'~'+inter_range.max);
				return inter_range;
			}
		},

		/**
		 * 随机生成第 index 个运算符
		 * @param int index 指示要随机生成的第几个运算符
		 * @return string 返回值：'+' | '-' | '*' | '/'
		 */
		genOperator: function (index, prev_operator) {
			var ops = [];
			if (this.isadd && this.range_op[index].add) ops.push('+');
			if (this.issub && this.range_op[index].sub) ops.push('-');
			if (this.ismul && this.range_op[index].mul) ops.push('*');
			if (this.isdiv && this.range_op[index].div) ops.push('/');
			// 有选择空间才进行？
			if( prev_operator && ops.length > 1 ) {
				// 加减不相邻，乘除不相邻
				if( this.dissimilarity_operator_adjacent ) {
					var arr = [];
					if( '+-'.indexOf(prev_operator) >= 0 ) {
						for(var i = 0; i < ops.length; i ++) {
							if( '*/'.indexOf(ops[i]) >= 0 ) {
								arr.push(ops[i]);
							}
						}
					} else {
						for(var i = 0; i < ops.length; i ++) {
							if( '+-'.indexOf(ops[i]) >= 0 ) {
								arr.push(ops[i]);
							}
						}
					}
					ops = arr;
				} 
				// 相邻的运算符不相同
				else if( this.diff_operator_adjacent ) {
					var arr = [];
					for(var i = 0; i < ops.length; i ++) {
						if( prev_operator !=  ops[i] ) {
							arr.push(ops[i]);
						}
					}
					ops = arr;
				}
			}
			if (ops.length < 1) return '+';
			if (ops.length == 1) return ops[0];
			var rnd = parseInt(Math.random() * 1000) % ops.length;
			var ret = ops[rnd];
			switch(ret) {
				case '+': this.report.addcnt++; break;
				case '-': this.report.subcnt++; break;
				case '*': this.report.mulcnt++; break;
				case '/': this.report.divcnt++; break;
			}
			return ret;
		},

		/**
		 * 随机为两项式生成一个在范围内的结果值（注意：本层结果值 == 父层左|右运算项值）
		 * @param json item 本层两项式对象
		 * @param null|json parent 父层两项式对象，顶层入为 null
		 * @return int 根据当前配置的用户选项和结果范围，返回一个合理的两项式结果
		 */
		genItemResult: function (items, item, parent) {
			// 先按本层的运算符取得结果的允许范围:
			var result_range = this.calcItemResultRange(items, item);
			var result, min = result_range.min, max = result_range.max;
			var genotinarr = [], notinarr = [], inarr = [];
			
			// 结果在某些情况下也要受到限制：
			// 1. 如果下一层是除法，本层是加减法，则尽量将结果控制在除法运算项允许的范围内？需要综合分析各个范围并给出解决方案?
			// 2. 结果范围 需要根据运算项修正一下范围？
			// 3. 生成除法的商时，要尽量避开素数 ... 否则乘数就不好找了


			// 顶层结果在此生成：
			if ( 0 == item.index ) {
				// 最外层结果 = 只要在最外层运算符规定的范围内就行
				result = randomInt(min, max, genotinarr, [], notinarr, inarr);
			} 
			// 非顶层要考虑本层和父层两个范围的合并问题：
			else {
				// 此时父层结果已经确定，再按父层运算符项确定父层左|右值的范围，并与当前层结果范围求交集，以尽量保证数值在允许的范围内：
				var parent_lor_range = this.calcItemLORRange(items, parent, parent.lor, true); // 父层结果已经生成?
				var inter_range = intersectionRange(parent_lor_range, {min: min - 0, max: max - 0});
				if( ! inter_range ) {
					// 此时只能尽量满足范围小的一层的要求，以小的范围为准？
					setWarning('警告：父层左|右值范围与当前层结果范围无交集：', JSON.stringify(parent_lor_range), JSON.stringify(result_range));
				} else {
					min = inter_range.min;
					max = inter_range.max;
					console.info('提示：父层左|右值范围与当前层结果范围交集为：', JSON.stringify(inter_range));
				}
				// 子层结果 = 父层的左（或右）值，但结果范围是本层运算符所规定的结果范围，而不是父层的范围
				result = this.genItemLORByRange(items, parent, {min:min, max:max, genotinarr:genotinarr, notinarr:notinarr, inarr:inarr});
			}

			console.log(Array(item.index*4).fill('-').join('') + 'genItemResult('+item.index+', '+item.lor+')：', 
				(item.lor=='lft'?'?':'X')+' '+item.operator+' '+(item.lor=='rgt'?'?':'X')+' = ',result, '('+result+'='+min+'~'+max+')');

			return result;
		},

		/**
		 * 根据当前选项为两项式生成在用户规定范围内的左|右值
		 * @param json item 两项式对象
		 * @return int 合法值
		 */
		genItemLOR: function (items, item) {
			var range = this.calcItemLORRange(items, item, item.lor, true); // 此时结果已经生成过了！
			var val = this.genItemLORByRange(items, item, range);
			if( isNaN(val) ) {
				setError(Array(item.index*4).fill('-').join('') + 'genItemLOR error:', val, JSON.stringify(item));
			} else {
				console.log(Array(item.index*4).fill('-').join('') + 'genItemLOR('+item.index+', '+item.lor+')：',
				 (item.lor=='lft'?val:'X')+' '+item.operator+' '+(item.lor=='rgt'?val:'X')+' = '+item.result, '('+val+'='+range.min+'~'+range.max+')');
			}
			return val;
		},

		// 根据已知条件：运算符号、结果，
		// 随机生成 index 层的左（或右）值，并尽量保证数值在规定的范围内
		genItemLORByRange: function (items, item, range) {
			var min = range.min, max = range.max;
			var genotinarr = range.genotinarr || [];
			var geinarr = range.geinarr || [];
			var notinarr = range.notinarr || [];
			var inarr = range.inarr || [];
			var old_min = min, old_max = max;

			if ('+' == item.operator) {
				// 限制：不管是被加数还是加数都不允许超过 item.result 的值
				if (max > item.result) {
					max = item.result; 
					if( min > max ) min = max; // 重新修正 min 由于 max 变化
					setWarning('    修正范围（加法项必须小于结果）：', old_min, old_max, '->', min, max);
				}
			}

			if ('-' == item.operator) {
				if( 'lft' == item.lor ) {
					// 被减数限制：为确保减法结果不为负数，被减数必须大于 item.result 才行
					if (min < item.result) {
						min = item.result;
						if( min > max ) max = min; // 重新修正 max 由于 min 变化
						setWarning('    重新修正了范围（被减数必须大于结果）：', old_min, old_max, '->', min, max);
					}
				}
				else if('rgt' == item.lor ) {
					genotinarr.push(0); // 减法不要生成 - 0 的情况
				}
			}

			if ('*' == item.operator) {
				if( 0 != item.result) {
					notinarr.push(0); // 注意：要避免产生：0 * ? = 95 的情况？
					if( min > item.result ) {
						min = max = item.result;
						setWarning('    重新修正了范围1（乘法项不能大于结果）：', old_min, old_max, min, max, item.result);
					} else if (max > item.result) {
						max = item.result; // 乘法因子不允许超过乘积，否则另一个因子会变成小数
						if( min > max ) min = max;
						setWarning('    重新修正了范围（乘法项不能大于结果）：', old_min, old_max, min, max, item.result);
					}
				}
				if( 0 != item.result) {
					// 避免整数了除不尽的情况？
					// 生成的数必须能被 item.result 整除，找出所有能被 result 整除的数
					// 先在范围内查找是否有可以除尽的，尽量生成能除尽的
					var found = false, tarr = [];
					for(var i = min; i <= max && i <= item.result; i ++) {
						if( item.result % i == 0 ) {
							if( i != 1 && i != item.result ) {
								found = true;
								if( inarr.indexOf(i) < 0 ) inarr.push(i); // 有非 1 和 本身的 优先，
							} else {
								tarr.push(i);
							}
						}
					} 
					if(!found) {
						// 在范围(min~max)内找不到商(item.result)的合适乘数，放弃
						if( tarr.length <= 0 ) {
							setError('在范围('+min+'~'+max+')内找不到商('+item.result+')的合适乘数，放弃');
						} else {
							// 此时一般此数值是【素数】，无法
							for(var i = 0; i < tarr.length; i++) {
								inarr.push(tarr[i]);
							}
						}
					}
				}
			}

			// 除法要尽量保证除数也在范围内？

			if ('/' == item.operator) {
				if ('rgt' == item.lor) {
					notinarr.push(0); // 注意：要避免产生 ? / 0 = ? 的情况，除数不能为 0
				} 
				if( 'lft' == item.lor ) {
					if( 0 == item.result ) return 0; // 0 / ? = 0, 如果除法结果是 0，则被除数只能是 0，没有随机的空间
					// 为了确保被除数能被除尽，被除数必须是商(item.result)的整数倍，并且必须在范围内
					// inarr = inarr.concat(g_divisor); // 不行：必须是 item.result 的倍数才行！
					var max_times = Math.round(max / item.result); // 最大倍数
					if(max_times < 1 ) max_times = 1;
					var min_times = Math.round(min / item.result); // 最小倍数
					if(min_times < 1 ) min_times = 1;
					var isok = false;
					for(var i = min_times; i <= max_times; i ++) {
						inarr.push(i * item.result);
						isok = true;
					}
					if( ! isok ) {
						setError("    错误：无法生成范围内的被除数！");
					}
				}
			}

			return randomInt(min, max, genotinarr, geinarr, notinarr, inarr);
		},

		randomLOR: function () {
			if( 'random' == this.strategy )
				return randomInt(0, 1000) % 2 == 1 ? 'lft' : 'rgt';
			return this.strategy;
		},

		/**
		 * 生成一个满足条件的算式
		 * @param {Array[object]} items 算式对象
		 * @param int index 第几个运算符
		 * @returns {Array[object]} 返回生成的算式对象
		 */
		genOneFormula: function (items, index) {
			if (!index) {
				index = 0;
				parent_lor = 'lft';
				// 1. 首先一次性按用户设置随机生成所有的运算符(因为父层计算范围时需要知道子层的范围)
				items = [];
				for (var i = 0; i < this.itemcount - 1; i++) {
					items[i] = {
						"index": i,
						"lor": this.randomLOR(),
						"lft": false,
						"operator": this.genOperator(i, (i>0?items[i-1].operator:'')),
						"rgt": false,
						"result": false
					};
				}
			}


			var item_lft, item_rgt;
			var parent = index > 0 ? items[index - 1] : null;

			// 先为本 index 层预先生成一个结果，同时也会作为父层左、右值（本层结果 = 父层左、右值）：
			items[index].result = this.genItemResult(items, items[index], parent); // 先根据运算符和结果范围随机生成结果

			// 先一直递归直到最后一项时才开始生成并回溯
			if (index < this.itemcount - 2) {
				// 先算子项，然后再根据子项的 result 来求本项的左、右值：
				this.genOneFormula(items, index + 1);
				var child = items[index + 1];
				if ('lft' == items[index].lor) {
					item_lft = child.result; // 左值确定，计算右值
					item_rgt = this.calcItem2Value(items, items[index], item_lft);
					// 由于乘法会产生误差：7 * 9 - ? = 65, 63 - ? = 65，这样就出负数了？
					if( item_rgt < 0 ) item_rgt = 0;
				} else {
					item_rgt = child.result; // 右值确定，计算左值
					item_lft = this.calcItem2Value(items, items[index], item_rgt);
					// 由于乘法会产生误差：7 * 9 / ? = 65, 63 / ? = 65，这样就出小数了
					if( item_lft < 0 ) item_lft = 0;
				}
			} else {
				// 这是最后的一层算式：
				if ('lft' == items[index].lor) {
					// 随机本层左值，计算右值
					item_lft = this.genItemLOR(items, items[index]); // 3. 确定运算项#1
					item_rgt = this.calcItem2Value(items, items[index], item_lft);
				} else if ('rgt' == items[index].lor) {
					// 随机本层右值，计算左值
					item_rgt = this.genItemLOR(items, items[index]); // 4. 确定运算项#2
					item_lft = this.calcItem2Value(items, items[index], item_rgt);
				}
			}

			// 乘法可能有除不尽的情况，此时重新修正一下得数，以供上级使用？
			var real_result = eval('('+item_lft+')' + items[index].operator + '('+item_rgt+')');
			if ( real_result != items[index].result ) {
				setWarning('第', index, '层结果与之前随机生成的结果', items[index].result, '不一致，已经重新设置为新结果：', real_result);
				items[index].result = real_result;
			}
			items[index].lft = parseInt(item_lft);
			items[index].rgt = parseInt(item_rgt);

			return items;
		},

		formulaToString: function(items) {
			var str = '', head, tail, tmpstr, op;
			var w = '' === this.whichcond ? randomInt(0, this.itemcount - 1) : this.whichcond - 0; // 已知得数，随机求某一个条件
			// 由内向外生成
			for (var i = items.length - 1; i >= 0; i--) {
				op = ChineseOP[items[i].operator];
				// 最外层不加括号
				head = 0 == i ? '' : '('; 
				tail = 0 == i ? '' : ')';
				if( i > 0 && this.parentheses.autofix ) {
					// 自动去掉无意义的括号
					if( '+*'.indexOf(items[i].operator) >= 0 && items[i].operator == items[i - 1].operator ) {
						head = tail = '';
					} else if( '+-'.indexOf(items[i - 1].operator) >= 0 && '*/'.indexOf(items[i].operator) >= 0 ) {
						head = tail = '';
					} else if( '-' == items[i - 1].operator && '-' == items[i].operator && 'lft' == items[i - 1].lor ) {
						head = tail = '';
					} else if( '/' == items[i - 1].operator && '/' == items[i].operator && 'lft' == items[i - 1].lor ) {
						head = tail = '';
					}
				}
				if (i == items.length - 1) {
					if( '2' == this.rule && w == i + 1) tmpstr = items[i].lft + op + this.blank(items[i].rgt);
					else if( '2' == this.rule && w == i + 0) tmpstr = this.blank(items[i].lft) + op + items[i].rgt;
					else tmpstr = items[i].lft + op + items[i].rgt;
					str = head + tmpstr + tail;
				} else {
					if ('lft' == items[i].lor) {
						if( '2' == this.rule && w == i + 0) tmpstr = this.blank(items[i].rgt);
						else tmpstr = items[i].rgt;
						str = head + str + op + tmpstr + tail;
					} else {
						if( '2' == this.rule && w == i + 0) tmpstr = this.blank(items[i].lft);
						else tmpstr = items[i].lft;
						str = head + tmpstr + op + str + tail;
					}
				}
			}
			// 已知得数，求条件，且第一个数就是被求的条件? 则将该数使用空白代替！
			str += '＝' + ( '1' == this.rule ? this.blank(items[0].result) : items[0].result);
			return str;
		},

		doGen: function () {
			g_mul_result = [];
			for(var a = this.range_mul[0].min; a <= this.range_mul[0].max; a ++) {
				for(var b = this.range_mul[1].min; b <= this.range_mul[1].max; b ++) {
					if( g_mul_result.indexOf(a*b) < 0 ) g_mul_result.push(a*b);
				}
			}
			g_divisor = [];
			for(var a = this.result_div.min; a <= this.result_div.max; a ++) {
				for(var b = this.range_div[1].min; b <= this.range_div[1].max; b ++) {
					if( g_divisor.indexOf(a*b) < 0 ) g_divisor.push(a*b);
				}
			}
			if (!this.isValid()) {
				return;
			}
			this.report.total = 0;
			this.report.addcnt = 0; // 加法题数量
			this.report.subcnt = 0; // 减法题数量
			this.report.mulcnt = 0;
			this.report.divcnt = 0;
			this.report.exceptcnt = 0; // 异常题数量(由于冲突，未能按规则生成)
			this.res = [];
			for (var i = 0; i < this.count; i++) {
				var item = {
					item: this.genOneFormula()
				};
				this.res.push(item);
			}
		},

		doPrint: function () {
			$("#print-part").wordExport("1");
			//window.print();
		},
		

		blank: function (v) {
			return '___';
		},
		

	}
});

