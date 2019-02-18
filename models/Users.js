module.exports = (sequelize, DataTypes) => {
	return sequelize.define("users", {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
			primaryKey: true
		},
		exp: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false
		}
	}, {
		timestamps: false
	});
};