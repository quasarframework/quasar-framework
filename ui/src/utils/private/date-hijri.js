import moment from 'moment-hijri'

/*
  Converts a hijri date to Gregorian.
*/
export function hijriToGregorian (iy, im, id) {
  const m = moment(iy + '/' + im + '/' + id, 'iYYYY/iM/iD') // Parse a Hijri date.

  return {
    gy: m.year(),
    gm: m.month(),
    gd: m.date()
  }
}

/*
  Converts a Gregorian date to hijri.
*/
export function GregorianToHijri (gy, gm, gd) {
  if (Object.prototype.toString.call(gy) === '[object Date]') {
    gd = gy.getDate()
    gm = gy.getMonth() + 1
    gy = gy.getFullYear()
  }
  const m = moment(gy + '/' + gm + '/' + gd, 'YYYY/M/D') // Parse a Hijri date.
  return {
    iy: m.iYear(),
    im: m.iMonth() + 1,
    id: m.iDate()
  }
}

/*
  Number of days in a given month in a hijri year.
*/
export function hijriMonthLength (iy, im) {
  return moment(iy + '/' + im + '/1', 'iYYYY/iM/iD').endOf('iMonth').iDate()
}
