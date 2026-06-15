// ---- Landing Page and Success ----

exports.getLanding = (req, res) => {
    res.render('public/layout', { title: 'Pendaftaran SPMB JIC 2026', bodyView: 'landing' });
};

exports.getSukses = (req, res) => {
    const noRef = req.query.noRef;
    res.render('public/layout', { title: 'Berhasil', bodyView: 'sukses', noRef });
};
