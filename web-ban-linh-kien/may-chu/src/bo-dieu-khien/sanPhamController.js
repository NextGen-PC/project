const SanPham = require('../mo-hinh/SanPham');
const BienThe = require('../mo-hinh/BienThe');

// Lấy danh sách sản phẩm (có lọc theo idDanhMuc và populate thông tin danh mục)
exports.layDanhSachSanPham = async (req, res) => {
    try {
        const { idDanhMuc } = req.query; // Lấy tham số ?idDanhMuc=... từ URL
        const filter = idDanhMuc ? { idDanhMuc: idDanhMuc } : {}; 
        
        const danhSach = await SanPham.find(filter)
            .populate('idDanhMuc')
            .populate('bienThe');
        res.json(danhSach);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết một sản phẩm
exports.layChiTietSanPham = async (req, res) => {
    try {
        const { id } = req.params;
        const sanPham = await SanPham.findById(id)
            .populate('idDanhMuc')
            .populate('bienThe');
        if (!sanPham) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
        res.json(sanPham);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo sản phẩm mới
exports.taoMoi = async (req, res) => {
    try {
        const { ten, idDanhMuc, gia, thongSo, bienThe } = req.body;
        const anh = req.file ? req.file.path : req.body.anh; // Lấy URL từ Cloudinary hoặc dùng URL text
        
        const sanPhamMoi = new SanPham({ ten, idDanhMuc, gia, anh, thongSo });
        await sanPhamMoi.save();

        // Nếu có mảng biến thể đi kèm, tạo luôn
        if (bienThe && Array.isArray(bienThe)) {
            const duLieuBienThe = bienThe.map(bt => ({
                ...bt,
                idSanPham: sanPhamMoi._id
            }));
            await BienThe.insertMany(duLieuBienThe);
        }

        // Lấy lại thông tin đầy đủ kèm biến thể vừa tạo
        const ketQua = await SanPham.findById(sanPhamMoi._id).populate('idDanhMuc').populate('bienThe');
        res.status(201).json(ketQua);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Cập nhật sản phẩm
exports.capNhat = async (req, res) => {
    try {
        const { id } = req.params;
        const { ten, idDanhMuc, gia, thongSo, bienThe } = req.body;
        
        let duLieuCapNhat = { ten, idDanhMuc, gia, thongSo };
        if (req.file) {
            duLieuCapNhat.anh = req.file.path; // Cập nhật ảnh mới từ Cloudinary nếu có upload
        } else if (req.body.anh) {
            duLieuCapNhat.anh = req.body.anh; // Hoặc dùng URL text nếu có gửi lên
        }

        const sanPhamCapNhat = await SanPham.findByIdAndUpdate(
            id,
            duLieuCapNhat,
            { new: true }
        );
        if (!sanPhamCapNhat) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // Nếu có gửi danh sách biến thể, cập nhật lại toàn bộ biến thể của sản phẩm này
        if (bienThe && Array.isArray(bienThe)) {
            // Xoá hết biến thể cũ của sản phẩm này
            await BienThe.deleteMany({ idSanPham: id });
            // Thêm lại danh sách mới
            const duLieuBienThe = bienThe.map(bt => ({
                ...bt,
                idSanPham: id
            }));
            await BienThe.insertMany(duLieuBienThe);
        }

        const ketQua = await SanPham.findById(id).populate('idDanhMuc').populate('bienThe');
        res.json(ketQua);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Xoá sản phẩm
exports.xoa = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Tìm và xoá sản phẩm
        const sanPhamDaXoa = await SanPham.findByIdAndDelete(id);
        if (!sanPhamDaXoa) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        // Xoá luôn các biến thể liên quan
        await BienThe.deleteMany({ idSanPham: id });

        res.json({ message: "Đã xoá sản phẩm và các biến thể liên quan thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Tạo nhanh dữ liệu mẫu (Cảnh báo: Hàm này cần idDanhMuc thật từ Database)
exports.taoDuLieuMau = async (req, res) => {
    res.status(400).json({ message: "Hàm này đã cũ. Vui lòng sử dụng chức năng tạo mới với idDanhMuc thực tế từ bảng Danh mục." });
};